// ============================================
// === Helper functions related to messages ===
// ============================================

// External dependencies
// We use json2csv to convert our messages JS object to a CSV file
const { parse: parseJsonToCsv } = require('json2csv')

// Internal dependencies
// Load our triage config
const triageConfig = require('./../config')

// The helper functions related to messages follow

// Recursive function to paginate through all history of a conversation
const getFullConvoHistory = async function (client, params, data = []) {
  const apiMethod = 'conversations.history'
  console.log(`Querying ${apiMethod} with ${JSON.stringify(params)}; already have ${data.length} in array`)

  return client.conversations
    .history(params)
    .then(response => {
      data.push(...response.messages)
      if (response.has_more === false) return data
      return getFullConvoHistory(
        client,
        Object.assign(params, {
          cursor: response.response_metadata.next_cursor
        }),
        data
      )
    })
    .catch(err => {
      console.error(JSON.stringify(err))
    })
}

// Get all messages for the past N hours
const getAllMessagesForPastHours = async function (channelId, nHoursToGoBack, client) {
  // Calculate begin time ("oldest") for analysis
  const beginAnalysisDate = new Date()
  beginAnalysisDate.setHours(beginAnalysisDate.getHours() - nHoursToGoBack)
  const oldest = Math.floor(beginAnalysisDate.getTime() / 1000)

  // Get all the messages
  const allMessages = await getFullConvoHistory(client, {
    channel: channelId,
    oldest
  })

  return allMessages
}

const filterAndEnrichMessages = function (messages, fromChannel, teamBotId, statsType) {
  // First, filter out messages from the team's bot
  const filteredMessages = messages.filter(m => {
    if (m.bot_id !== teamBotId) return true
  })

  // Create a new object we will enrich and return
  const enrichedMessages = filteredMessages

  // Loop through all messages and enrich them additional attributes so we can do filters on them later
  enrichedMessages.forEach(message => {
    // Regardless of statsType, we want to populate a few key/values
    // Add `channel` attribute with the channel we retrieved the message from
    message.channel = fromChannel

    // Create a new `_all_reactions` attribute with an array of all reactions (regardless of if they are relevant to triage analysis)
    message._all_reactions = message.reactions
      ? message.reactions.map(r => `:${r.name}:`)
      : []

    // Add `_threadedReplyCount` and `_threadedReplyUsersCount` with the # of replies and # users who wrote those replies
    message._threadedReplyCount = message.reply_count || 0
    message._threadedReplyUsersCount = message.reply_users_count || 0

    // If message is by a bot (such as workflow builder), put the bot ID in the user field
    if (message.subtype === 'bot_message') {
      message.user = message.bot_id
      if (message.bot_profile.is_workflow_bot === true) {
        message._postedByWorkflowBuilder = true
      }
    }

    if (statsType === 'triage') {
      // Do additional status and level analysis for triage stats requests
      // Add array attributes we will populate later
      message._statuses = []
      message._levels = []

      // Populate `_level_XXX` attribute with boolean and add to array of _levels
      triageConfig._.levels.forEach(level => {
        if (message.text.includes(triageConfig._.levelToEmoji[level])) {
          message[`_level_${level}`] = true
          message._levels.push(level)
        }
      })

      // Populate `_status_XXX` attribute with boolean and add to array of _statuses
      triageConfig._.statuses.forEach(status => {
        if (message._all_reactions.includes(triageConfig._.statusToEmoji[status])) {
          message[`_status_${status}`] = true
          message._statuses.push(status)
        }
      })
    } else if (statsType === 'generic') {
      // If generic analysis, let's dive deeper into the count of each emoji
      // nothing currently added for generic analysis
      message.reactions.forEach((reaction) => {
        const key = `_nUsersReactedWith_${reaction.name}`
        message[key] = reaction.count
      })
    }
  })

  return enrichedMessages
}

const messagesToCsv = function (messages, statsType) {
  try {
    // Create CSV header row
    const csvFields = [
      'channel',
      'ts',
      'type',
      'subtype',
      'user',
      'team',
      'text',
      'blocks',
      'attachments',
      'reactions',
      '_postedByWorkflowBuilder',
      '_all_reactions',
      '_threadedReplyCount',
      '_threadedReplyUsersCount'
    ]

    // add specific columns related to triage stats if relevant
    if (statsType === 'triage') {
      csvFields.push('_levels', '_stats')

      const statusFields = triageConfig._.statuses.map(s => `_status_${s}`)
      const levelFields = triageConfig._.levels.map(l => `_level_${l}`)

      csvFields.push(...levelFields, ...statusFields)
    } else if (statsType === 'generic') {
      // Get a unique list of `nUsersReactedWith_` keys so we can use them as columns in the csv
      const allReactionKeys = new Set()
      messages.forEach((m) => {
        Object.keys(m)
          .filter((k) => k.includes('nUsersReactedWith_'))
          .forEach((k) => allReactionKeys.add(k))
      })
      console.log(allReactionKeys)
      csvFields.push(...Array.from(allReactionKeys))
    }

    console.log(csvFields)
    const csvOpts = { fields: csvFields }
    const csvString = parseJsonToCsv(messages, csvOpts)
    return csvString
  } catch (e) {
    return ''
  }
}

module.exports = {
  getAllMessagesForPastHours,
  filterAndEnrichMessages,
  messagesToCsv
}
