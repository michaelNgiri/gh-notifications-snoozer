const React = require('react')
const { shell } = require('electron')
const { connect } = require('react-redux')

const MS_PER_DAY = 1000 * 60 * 60 * 24

class TaskListItem extends React.Component {
  onChange(event) {
    const { task } = this.props
    const type = event.target.checked ? 'TASKS_SELECT' : 'TASKS_DESELECT'

    this.props.dispatch({ type, task })
  }

  daysBetween(a, b) {
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
    return Math.floor((utc2 - utc1) / MS_PER_DAY)
  }

  isVisible() {
    const { task } = this.props

    if (task.ignore) {
      return false
    }

    if (typeof task.snoozedAt === 'string') {
      const currentDate = new Date()
      const snoozeDate = new Date(task.snoozedAt)
      if (this.daysBetween(snoozeDate, currentDate) < 1) {
        // Snoozed within the last day, keep it hidden
        return false
      }
    }

    if (typeof task.archivedAt === 'string') {
      const updateDate = new Date(task.updatedAt)
      const archiveDate = new Date(task.archivedAt)
      if (archiveDate > updateDate) {
        // Has not been updated since it was archived, keep it hidden
        return false
      }
    }

    return true
  }

  openExternal(event) {
    event.preventDefault()
    const { task } = this.props
    shell.openExternal(task.url)
  }

  iconClass() {
    const { task } = this.props
    const iconClasses = ['octicon']
    if (task.isPullRequest) {
      iconClasses.push('octicon-git-pull-request')
      if (task.state === 'open') {
        iconClasses.push('opened')
      } else if (task.state === 'closed') {
        iconClasses.push('closed')
      }
    } else {
      if (task.state === 'open') {
        iconClasses.push('octicon-issue-opened')
      } else if (task.state === 'closed') {
        iconClasses.push('octicon-issue-closed')
      }
    }
    return iconClasses.join(' ')
  }

  render() {
    const { task } = this.props

    if (!this.isVisible()) {
      return null
    }

    return (
      <li className="task-list-item control columns">
        <div className="column has-text-right">
          <input
            id={task.key}
            type="checkbox"
            className="task-list-item-checkbox"
            onChange={event => this.onChange(event)}
          />
        </div>
        <div className="column has-text-centered">
          <label className="checkbox task-list-item-state-label" htmlFor={task.key}>
            <span title={task.state} className={this.iconClass()}></span>
          </label>
        </div>
        <div className="column task-list-item-repository-owner-column has-text-right">
          <label className="checkbox" htmlFor={task.key}>
            <img
              src={task.repositoryOwner.avatarUrl}
              alt={task.repositoryOwner.login}
              className="task-list-item-repository-owner-avatar"
            />
          </label>
        </div>
        <div className="is-8 column">
          <label className="checkbox main-label" htmlFor={task.key}>
            <span className="task-list-item-title">{task.title}</span>
            <span className="task-list-meta">
              <span>Created </span>
              <span>by </span>
              <img
                src={task.user.avatarUrl}
                alt={task.user.login}
                className="task-list-item-user-avatar"
              />
              <span> </span>
              <span className="task-list-item-user">
                {task.user.login}
              </span>
              <span> in </span>
              <span className="task-list-item-repository">
                {task.repository}
              </span>
            </span>
          </label>
        </div>
        <div className="column has-text-right task-list-item-time-column">
          <label className="checkbox" htmlFor={task.key}>
            <time className="task-list-item-time">
              {new Date(task.updatedAt).toLocaleDateString()}
            </time>
          </label>
        </div>
        <div className="column has-text-right">
          <a href={task.url} onClick={event => this.openExternal(event)}>
            <span className="octicon octicon-link-external"></span>
          </a>
        </div>
      </li>
    )
  }
}

TaskListItem.propTypes = {
  task: React.PropTypes.object.isRequired,
  dispatch: React.PropTypes.func.isRequired,
}

module.exports = connect()(TaskListItem)