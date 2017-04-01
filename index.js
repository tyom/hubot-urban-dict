// Description:
//   Gives an Urban Dictionary definition for a given word.

// Commands:
//   hubot what('s| is) <word>    = <details> - top result from the results list. Repeated requests cycle through the list
//   hubot what('s | is) a <word> = <details> - a random result from the list

const axios = require('axios')
const sample = require('lodash/sample')
const remove = require('lodash/remove')
const bindAll = require('lodash/bindAll')

axios.defaults.baseURL = 'http://api.urbandictionary.com/v0'

let UrbanDict = {
  searchTerm: '',
  prevSearchTerm: '',
  results: [],
  shouldRandomiseResult: false,

  init(res, shouldRandomiseResult) {
    this.res = res
    if (!this.res) {
      throw new Error('robot response is required')
    }
    this.shouldRandomiseResult = shouldRandomiseResult

    return bindAll(this, 'setCache', 'getResultItem', 'post')
  },

  find(term) {
    this.searchTerm = term

    if (this.searchTerm === this.prevSearchTerm && this.results.length) {
      // serve from cache
      const pick = this.getResultItem()
      return this.post(pick)
    }
    return axios.get(`/define?term=${term}`)
      .then(res => res.data)
      .then(this.setCache)
      .then(this.getResultItem)
      .then(this.post)
      .catch(this.rescue)
  },

  getResultItem() {
    if (this.shouldRandomiseResult) {
      const pick = sample(this.results)
      remove(this.results, pick)
      return pick
    }

    return this.results.pop()
  },

  post(item) {
    if (!item) {
      return this.res.send(`I don’t know what ${this.searchTerm} is.`)
    }

    const formattedExample = item.example ? `\n\n${item.example.trim().replace(/^/gm, '> ')}` : ''
    this.prevSearchTerm = this.searchTerm
    return this.res.send(item.definition + formattedExample)
  },

  setCache({list=[]}) {
    this.results = [...list]
  },

  rescue(err) {
    console.log(err)
  }
}


module.exports = (robot) => {
  robot.respond(/what ?([i']s ?a?) ([^?]*)[?]*/i, (res) => {
    const searchTerm = res.match[2]
    const shouldRandomiseResult =  res.match[1].match(/ ?['i]s a/)

    if (!searchTerm) {return}

    UrbanDict.init(res, shouldRandomiseResult).find(searchTerm)
  })
}
