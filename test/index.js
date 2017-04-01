const Helper = require('hubot-test-helper')
const expect = require('chai').expect
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const rewire = require('rewire')
const sinon = require('sinon')

const helper = new Helper('../index.js')

describe('hubot-urban-dictionary', () => {
  let room
  let urbanDictObj
  const mock = new MockAdapter(axios);

  before(() => {
    urbanDictObj = rewire('../').__get__('UrbanDict')

    const testData = {
      list: [
        {definition: 'first meme definition', example: 'usage example'},
        {definition: 'second meme definition', example: 'usage example'},
        {definition: 'third meme definition', example: 'usage example'},
      ]
    }

    mock.onGet('/define?term=meme').reply(200, testData)
    mock.onGet('/define?term=doesnotexist').reply(200, {list: []})
  })

  beforeEach(() => {
    room = helper.createRoom()
  })

  afterEach(() => {
    room.destroy()
  })

  describe('hubot', () => {
    it('responds with a message when definition is not found', () => {
      room.user.say('tyom', 'hubot what is doesnotexist')
        .then(() => expect(room.messages[1][1]).to.eql('I don’t know what doesnotexist is.'))
    })

    it('responds with the first item in the list or results', () => {
      room.user.say('tyom', 'hubot what is meme')
        .then(() => expect(room.messages[1][1]).to.eql('third meme definition\n\n> usage example'))
    })
  })

  describe('module', () => {
    describe('pick a random result from the list', () => {
      beforeEach(() => {
        urbanDictObj.init({
          send: sinon.spy()
        }, true)
      })

      it('should pick a random result when instructed”', () => {
        urbanDictObj.find('meme')
          .then(() => {
            expect(urbanDictObj.res.send.callCount).to.equal(1)
            expect(urbanDictObj.shouldRandomiseResult).to.be.true
            expect(urbanDictObj.res.send.args[0]).to.be.not.empty
          })
      })
    })
  })
})
