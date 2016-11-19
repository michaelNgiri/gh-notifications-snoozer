const React = require('react')
const { connect } = require('react-redux')
const { shell } = require('electron')
const GitHub = require('../../models/GitHub')
const TaskListItem = require('../TaskListItem')
const hookUpStickyNav = require('../hookUpStickyNav')
const TaskVisibility = require('../../models/TaskVisibility')

class TaskList extends React.Component {
  constructor(props) {
    super(props)
    this.state = { focusedIndex: 0 }
  }

  componentDidMount() {
    this.keyDownEventListener = event => this.onKeyDown(event)
    document.addEventListener('keydown', this.keyDownEventListener)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keyDownEventListener)
  }

  onKeyDown(event) {
    const up = ['ArrowUp', 'k']
    const down = ['ArrowUp', 'j']
    const open = ['Enter', 'o']
    const select = [' ', 'x']
    const escape = ['Escape']
    const archive = ['a']
    const snooze = ['s']
    const ignore = ['i']

    event.preventDefault()

    if (up.includes(event.key)) {
      this.focusPreviousTask()
    } else if (down.includes(event.key)) {
      this.focusNextTask()
    } else if (escape.includes(event.key)) {
      this.setState({ focusedIndex: 0 })
    } else if (open.includes(event.key)) {
      this.openFocusedTask()
    } else if (select.includes(event.key)) {
      this.onToggle()
    } else if (snooze.includes(event.key)) {
      this.snooze()
    } else if (archive.includes(event.key)) {
      this.archive()
    } else if (ignore.includes(event.key)) {
      this.ignore()
    }
  }

  openFocusedTask() {
    shell.openExternal(this.focusedTask().url)
  }

  focusNextTask() {
    const lastIndex = this.props.tasks.length - 1
    let focusedIndex = this.state.focusedIndex + 1
    if (focusedIndex > lastIndex) focusedIndex = 0
    this.setState({ focusedIndex })
  }

  focusPreviousTask() {
    const lastIndex = this.props.tasks.length - 1
    let focusedIndex = this.state.focusedIndex + -1
    if (focusedIndex < 0) focusedIndex = lastIndex
    this.setState({ focusedIndex })
  }

  focusedTask() {
    return this.props.tasks[this.state.focusedIndex]
  }

  snooze() {
    this.props.dispatch({ type: 'TASKS_SNOOZE', task: this.focusedTask() })
  }

  archive() {
    this.props.dispatch({ type: 'TASKS_ARCHIVE', task: this.focusedTask() })
  }

  ignore() {
    this.props.dispatch({ type: 'TASKS_IGNORE', task: this.focusedTask() })
  }

  changeFilter(filterName) {
    const selectedFilter = this.props.filters.find(filter => filter.name === filterName)
    this.props.dispatch({ type: 'FILTERS_SELECT', filter: selectedFilter })
  }

  editSelectedFilter() {
    this.props.editFilter(this.props.activeFilter)
  }

  refresh(event) {
    event.currentTarget.blur() // defocus button
    const github = new GitHub()
    github.getTasks(this.props.activeFilter).then(result => {
      const tasks = result.tasks

      // GitHub's api doesn't like when the output includes milliseconds
      const updatedAt = (new Date()).toISOString().replace(/\.\d{3}Z/, 'Z')
      const filter = Object.assign({}, this.props.activeFilter, { updatedAt })
      this.props.dispatch({ type: 'TASKS_UPDATE', filter, tasks })
      this.props.dispatch({ type: 'FILTERS_UPDATE', filter })
    })
  }

  taskListOrMessage() {
    const sortedTasks = this.props.tasks.sort((a, b) => {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    })

    if (this.props.tasks.length > 0) {
      return (
        <ol className="task-list">
          {sortedTasks.map((task, index) => {
            const isFocused = (index === this.state.focusedIndex)
            return (
              <TaskListItem
                task={task}
                key={task.storageKey}
                isFocused={isFocused}
                onToggle={() => this.onToggle(index)}
              />
            )
          })}
        </ol>
      )
    }
  }

  render() {
    return (
      <div>
        <nav className="task-list-navigation secondary-nav nav has-tertiary-nav">
          <div className="nav-left">
            <span className="nav-item compact-vertically">
              <span className="select">
                <select
                  id="filters-menu"
                  onChange={event => this.changeFilter(event.target.value)}
                  value={this.props.activeFilter ? this.props.activeFilter.name : ''}
                >
                  {this.props.filters.map(filter => (
                    <option key={filter.name} value={filter.name}>{filter.name}</option>
                  ))}
                </select>
              </span>
              <button
                onClick={e => this.refresh(e)}
                type="button"
                title="Refresh list"
                className="is-link button"
              >🔄</button>
            </span>
          </div>
          <div className="nav-right">
            <span className="nav-item compact-vertically">
              <button
                type="button"
                onClick={() => this.snooze()}
                className="control button is-link"
                id="snooze-button"
                title="Snooze selected"
                disabled={!this.focusedTask()}
              >😴 Snooze</button>
            </span>
            <span className="nav-item compact-vertically">
              <button
                type="button"
                id="archive-button"
                className="control button is-link"
                onClick={() => this.archive()}
                title="Archive selected"
                disabled={!this.focusedTask()}
              >📥 Archive</button>
            </span>
            <span className="nav-item compact-vertically">
              <button
                type="button"
                className="control button is-link"
                onClick={() => this.ignore()}
                title="Ignore selected"
                disabled={!this.focusedTask()}
              >❌ Ignore</button>
            </span>
          </div>
        </nav>
        <nav className="task-list-navigation tertiary-nav nav">
          <div className="nav-left">
            <span className="nav-item compact-vertically">
              <button
                onClick={() => this.props.showHidden()}
                type="button"
                className="is-link is-small button"
                title="Show hidden tasks"
              >View hidden</button>
              <button
                onClick={() => this.editSelectedFilter()}
                type="button"
                className="is-link is-small button"
                title="Edit selected filter"
              >Edit</button>
            </span>
          </div>
        </nav>
        <div className="task-list-container">
          {this.taskListOrMessage()}
        </div>
      </div>
    )
  }
}

TaskList.propTypes = {
  activeFilter: React.PropTypes.object,
  dispatch: React.PropTypes.func.isRequired,
  editFilter: React.PropTypes.func.isRequired,
  filters: React.PropTypes.array.isRequired,
  showHidden: React.PropTypes.func.isRequired,
  tasks: React.PropTypes.array.isRequired,
}

const stickyNavd = hookUpStickyNav(TaskList, '.task-list-navigation')
const mapStateToProps = state => {
  const activeFilter = state.filters.find(filter => filter.selected)
  const tasks = state.tasks.filter(task => TaskVisibility.isVisibleTask(task, activeFilter))
  const filters = state.filters
  return { tasks, activeFilter, filters }
}

module.exports = connect(mapStateToProps)(stickyNavd)
