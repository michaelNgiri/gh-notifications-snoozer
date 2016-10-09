const assert = require('assert')
const Redux = require('redux')

const FiltersReducer = require('../../src/reducers/FiltersReducer')

describe('Filters reducer', () => {
  it('has the correct default initial state', () => {
    const store = Redux.createStore(FiltersReducer)
    assert.deepEqual([], store.getState())
  })

  describe('FILTERS_ADD', () => {
    it('adds a filter', () => {
      const initialFilters = [{ name: 'first filter', query: 'label:first' }]
      const store = Redux.createStore(FiltersReducer, initialFilters)

      store.dispatch({ type: 'FILTERS_ADD', name: 'new filter', query: 'label:new' })
      const expectedFilters = [
        { name: 'first filter', query: 'label:first' },
        { name: 'new filter', query: 'label:new' },
      ]

      assert.deepEqual(expectedFilters, store.getState())
    })
  })

  describe('FILTERS_UPDATE_QUERY', () => {
    it('updates an existing filter', () => {
      const initialFilters = [{ name: 'first filter', query: 'label:first' }]
      const store = Redux.createStore(FiltersReducer, initialFilters)

      store.dispatch({ type: 'FILTERS_UPDATE_QUERY', name: 'first filter', query: 'label:updated' })
      const expectedFilters = [
        { name: 'first filter', query: 'label:updated' },
      ]

      assert.deepEqual(expectedFilters, store.getState())
    })
  })

  describe('FILTERS_REMOVE', () => {
    it('removes a filter', () => {
      const initialFilters = [{ name: 'first filter', query: 'label:first' }]
      const store = Redux.createStore(FiltersReducer, initialFilters)

      store.dispatch({ type: 'FILTERS_REMOVE', name: 'first filter' })
      assert.deepEqual([], store.getState())
    })
  })

  describe('FILTERS_SELECT', () => {
    it('selects a filter', () => {
      const initialFilters = [
        { name: 'first filter', query: 'label:first', selected: true },
        { name: 'second filter', query: 'label:second', selected: false },
      ]
      const store = Redux.createStore(FiltersReducer, initialFilters)

      store.dispatch({ type: 'FILTERS_SELECT', name: 'second filter' })
      const expectedFilters = [
        { name: 'first filter', query: 'label:first', selected: false },
        { name: 'second filter', query: 'label:second', selected: true },
      ]
      assert.deepEqual(expectedFilters, store.getState())
    })

    it('removes selected filter if no name is sent', () => {
      const initialFilters = [
        { name: 'first filter', query: 'label:first', selected: true },
        { name: 'second filter', query: 'label:second', selected: false },
      ]
      const store = Redux.createStore(FiltersReducer, initialFilters)

      store.dispatch({ type: 'FILTERS_SELECT' })
      const expectedFilters = [
        { name: 'first filter', query: 'label:first', selected: false },
        { name: 'second filter', query: 'label:second', selected: false },
      ]
      assert.deepEqual(expectedFilters, store.getState())
    })
  })
})