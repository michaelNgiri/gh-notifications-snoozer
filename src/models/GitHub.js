const GitHubAuth = require('./GitHubAuth')

class GitHub {
  constructor(token) {
    this.token = token
  }

  graphql(query, variables = {}) {
    const url = 'https://api.github.com/graphql'
    const options = {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      headers: this.getHeaders(),
    }

    console.log(JSON.stringify(variables))

    return fetch(url, options).then(response => {
      if (!response.ok) {
        return response.json().then(json => {
          throw new Error(`${response.status}: ${JSON.stringify(json)}`)
        })
      }

      return response.json().then(result => {
        if (result.errors) {
          throw new Error(`GraphQL Error: ${result.errors.map(e => e.message)}`)
        }

        return result.data
      })
    })
  }

  getTasks(filter) {
    const extraParams = filter.updatedAt ? ` updated:>${filter.updatedAt}` : ' is:open'
    const searchQuery = `${filter.query} ${extraParams}`
    return this.getIssuesFromSearchQuery(searchQuery)
  }

  getIssuesFromSearchQuery(searchQuery, endCursor, edges = []) {
    return this.graphql(this.taskQuery(), { searchQuery, endCursor }).then(results => {
      const allEdges = edges.concat(results.search.edges)

      if (results.search.pageInfo.hasNextPage) {
        const nextEndCursor = results.search.pageInfo.endCursor
        return this.getIssuesFromSearchQuery(searchQuery, nextEndCursor, allEdges)
      }

      return { tasks: allEdges.map(edge => this.transformEdgeToTask(edge)) }
    })
  }

  getCurrentUser() {
    const query = `{
      viewer {
        login
      }
    }`

    return this.graphql(query).then(result => result.viewer)
  }

  getHeaders() {
    if (!this.token) {
      this.token = GitHubAuth.getToken()
    }
    return {
      Authorization: `bearer ${this.token}`,
    }
  }

  transformEdgeToTask(edge) {
    const node = edge.node
    const type = node.type === 'PullRequest' ? 'pull' : 'issue'
    return {
      storageKey: `${type}-${node.id}`,
      id: node.id,
      type: node.type,
      title: node.title,
      body: node.body,
      state: node.state,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      isPullRequest: node.type === 'PullRequest',
      url: node.url,
      number: node.number,
      repository: `${node.repository.owner.login}/${node.repository.name}`,
      repositoryOwner: node.repository.owner.login,
      repositoryOwnerUrl: node.repository.owner.url,
      repositoryOwnerAvatar: node.repository.owner.avatarURL,
      user: node.author.login,
      userUrl: node.author.url,
      userAvatar: node.author.avatarURL,
      comments: node.comments ? node.comments.totalCount : 0,
    }
  }

  taskQuery() {
    return `query($searchQuery: String!, $endCursor: String) {
      search(first: 30, query: $searchQuery, after: $endCursor, type: ISSUE) {
        pageInfo {
         endCursor,
          hasNextPage
        }
        edges {
          node {
            ... on Issueish {
              body,
              id,
              title,
              number,
              type: __typename,

              author {
                login,
                url,
                avatarURL
              },

              repository {
                name,
                owner {
                  login
                  url,
                  avatarURL
                },
              },
            },
            ... on Issue {
              url,
              state,
              updatedAt,
              createdAt,
              comments(last: 1) {
                totalCount,
                edges {
                  node {
                    author {
                      login
                    }
                  }
                }
              }
            },
            ... on PullRequest {
              url,
              state,
              updatedAt,
              createdAt
            }
          }
        }
      }
    }`
  }
}

module.exports = GitHub
