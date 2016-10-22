const React = require('react')
const { connect } = require('react-redux')
const { shell } = require('electron')

const TaskListItem = require('../TaskListItem')
const hookUpStickyNav = require('../hookUpStickyNav')
const Filters = require('../../models/Filters')
const LastFilter = require('../../models/LastFilter')
const TaskVisibility = require('../../models/TaskVisibility')

class TaskList extends React.Component {
  constructor(props) {
    super(props)
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
  }

  componentDidMount() {
    document.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('keydown', this.onKeyDown)
  }

  onSnoozeClick(event) {
    event.currentTarget.blur() // defocus button
    this.props.dispatch({ type: 'TASKS_SNOOZE' })
  }

  onArchiveClick(event) {
    event.currentTarget.blur() // defocus button
    this.props.dispatch({ type: 'TASKS_ARCHIVE' })
  }

  onIgnoreClick(event) {
    event.currentTarget.blur() // defocus button
    this.props.dispatch({ type: 'TASKS_IGNORE' })
  }

  onKeyUp(event) {
    if (this.isFiltersMenuFocused()) {
      return
    }
    if (event.key === 'ArrowUp') {
      this.focusPreviousTask()
    } else if (event.key === 'ArrowDown') {
      this.focusNextTask()
    } else if (event.key === 'Escape') {
      this.props.dispatch({ type: 'TASKS_DEFOCUS' })
    } else if (event.key === 'Enter') {
      if (typeof this.props.focusedTask === 'object') {
        this.openLinkToFocusedTask()
      }
    }
  }

  onKeyDown(event) {
    if (this.isFiltersMenuFocused()) {
      return
    }
    if (event.key === ' ' && typeof this.props.focusedTask === 'object') {
      event.preventDefault()
      this.selectFocusedTask()
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
    }
  }

  loadNextPage(event) {
    event.currentTarget.blur() // defocus button
    this.props.loadNextPage()
  }

  loadPrevPage(event) {
    event.currentTarget.blur() // defocus button
    this.props.loadPrevPage()
  }

  isFiltersMenuFocused() {
    return document.activeElement &&
        document.activeElement.id === 'filters-menu'
  }

  changeFilter(event) {
    const filter = event.target.value
    if (filter === '') {
      return
    }
    this.props.changeFilter(filter)
  }

  editSelectedFilter() {
    this.props.editFilter(LastFilter.retrieve())
  }

  refresh(event) {
    event.currentTarget.blur() // defocus button
    const filter = document.getElementById('filters-menu').value
    this.props.changeFilter(filter)
  }

  selectFocusedTask() {
    const task = this.props.focusedTask
    const type = task.isSelected ? 'TASKS_DESELECT' : 'TASKS_SELECT'
    this.props.dispatch({ type, task: { storageKey: task.storageKey } })
  }

  openLinkToFocusedTask() {
    shell.openExternal(this.props.focusedTask.url)
  }

  getFocusIndex() {
    if (typeof this.props.focusedTask !== 'object') {
      return null
    }
    const needle = this.props.focusedTask.storageKey
    const haystack = this.props.tasks.map(task => task.storageKey)
    return haystack.indexOf(needle)
  }

  focusNextTask() {
    const oldIndex = this.getFocusIndex()
    let newIndex = typeof oldIndex === 'number' ? oldIndex + 1 : 0
    if (newIndex > this.props.tasks.length - 1) {
      newIndex = 0
    }
    this.focusTaskAtIndex(newIndex)
  }

  focusPreviousTask() {
    const oldIndex = this.getFocusIndex()
    const lastIndex = this.props.tasks.length - 1
    let newIndex = typeof oldIndex === 'number' ? oldIndex - 1 : lastIndex
    if (newIndex < 0) {
      newIndex = lastIndex
    }
    this.focusTaskAtIndex(newIndex)
  }

  focusTaskAtIndex(index) {
    const storageKey = this.props.tasks[index].storageKey
    this.props.dispatch({ type: 'TASKS_FOCUS', task: { storageKey } })
  }

  taskListOrMessage() {
    if (this.props.tasks.length > 0) {
      return (
        <ol className="task-list">
          {this.props.tasks.map(task => {
            const key = `${task.storageKey}-${task.isSelected}-${task.isFocused}`
            return <TaskListItem {...task} key={key} />
          })}
        </ol>
      )
    }
    if (this.props.loading) {
      return <p>Loading...</p>
    }
    return <p>You&rsquo;ve reached the end!</p>
  }

  paginationSection() {
    const haveNextPage = typeof this.props.loadNextPage === 'function'
    const havePrevPage = typeof this.props.loadPrevPage === 'function'
    const havePagination = haveNextPage || havePrevPage
    if (!havePagination) {
      return null
    }
    return (
      <nav className="pagination">
        <button
          type="button"
          className="button"
          onClick={e => this.loadPrevPage(e)}
          disabled={!havePrevPage}
        >&larr; Previous Page</button>
        <button
          type="button"
          className="button"
          onClick={e => this.loadNextPage(e)}
          disabled={!haveNextPage}
        >Next Page &rarr;</button>
        <ul></ul>
      </nav>
    )
  }

  render() {
    const filters = Filters.findAll()
    const lastFilterKey = LastFilter.retrieve()
    const anyTaskSelected = this.props.tasks.
        filter(task => task.isSelected).length > 0
    const isSnoozeDisabled = !anyTaskSelected
    const isArchiveDisabled = isSnoozeDisabled
    const isIgnoreDisabled = isSnoozeDisabled
    if (this.props.appMenu) {
      this.props.appMenu.toggleTaskOptions(anyTaskSelected)
    }
    return (
      <div>
        <nav className="task-list-navigation secondary-nav nav has-tertiary-nav">
          <div className="nav-left">
            <span className="nav-item compact-vertically">
              <span className="select">
                <select
                  id="filters-menu"
                  onChange={event => this.changeFilter(event)}
                  defaultValue={lastFilterKey}
                >
                  {filters.map(key => (
                    <option key={key} value={key}>{key}</option>
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
                id="archive-button"
                className="control button is-link"
                onClick={e => this.onArchiveClick(e)}
                title="Archive selected"
                disabled={isArchiveDisabled}
              >📥 Archive</button>
            </span>
            <span className="nav-item compact-vertically">
              <button
                type="button"
                onClick={e => this.onSnoozeClick(e)}
                className="control button is-link"
                id="snooze-button"
                title="Snooze selected"
                disabled={isSnoozeDisabled}
              >😴 Snooze</button>
            </span>
            <span className="nav-item compact-vertically">
              <button
                type="button"
                className="control button is-link"
                onClick={e => this.onIgnoreClick(e)}
                title="Ignore selected"
                disabled={isIgnoreDisabled}
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
          {typeof this.props.currentPage === 'number' ? (
            <div className="nav-right">
              <span className="nav-item compact-vertically">
                <span className="current-page is-small button is-link">
                  Page {this.props.currentPage}
                </span>
              </span>
            </div>
          ) : ''}
        </nav>
        <div className="task-list-container">
          {this.taskListOrMessage()}
          {this.paginationSection()}
        </div>
      </div>
    )
  }
}

TaskList.propTypes = {
  tasks: React.PropTypes.array.isRequired,
  dispatch: React.PropTypes.func.isRequired,
  addFilter: React.PropTypes.func.isRequired,
  changeFilter: React.PropTypes.func.isRequired,
  user: React.PropTypes.object,
  manageFilters: React.PropTypes.func.isRequired,
  showAuth: React.PropTypes.func.isRequired,
  showHidden: React.PropTypes.func.isRequired,
  editFilter: React.PropTypes.func.isRequired,
  loadPrevPage: React.PropTypes.func,
  loadNextPage: React.PropTypes.func,
  currentPage: React.PropTypes.number,
  loading: React.PropTypes.bool.isRequired,
  focusedTask: React.PropTypes.object,
  appMenu: React.PropTypes.object,
}

const stickyNavd = hookUpStickyNav(TaskList, '.task-list-navigation')
const mapStateToProps = state => ({
  tasks: state.tasks.filter(task => TaskVisibility.isVisibleTask(task)),
  focusedTask: state.tasks.find(task => task.isFocused),
})
module.exports = connect(mapStateToProps)(stickyNavd)
