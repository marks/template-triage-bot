module.exports = {
  select_channel_and_config: {
    callback_id: 'channel_selected',
    title: {
      type: 'plain_text',
      text: 'Channel Stats',
      emoji: true
    },
    submit: {
      type: 'plain_text',
      text: 'Submit',
      emoji: true
    },
    type: 'modal',
    close: {
      type: 'plain_text',
      text: 'Cancel',
      emoji: true
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':wave: Please select a channel to retrieve triage stats for.'
        }
      },
      {
        type: 'divider'
      },
      {
        block_id: 'channel',
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'Select a channel',
          emoji: true
        },
        element: {
          action_id: 'channel',
          type: 'conversations_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select a channel',
            emoji: true
          },
          default_to_current_conversation: true,
          filter: {
            include: [
              'public'
            ]
          }
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'A bot :robot_face: will be added to the channel'
          }
        ]
      },
      {
        block_id: 'n_hours',
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'How far back should we look?',
          emoji: true
        },
        element: {
          action_id: 'n_hours',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select how far to look back',
            emoji: true
          },
          initial_option: {
            value: '168',
            text: {
              type: 'plain_text',
              text: '7 days'
            }
          },
          options: [
            {
              value: '12',
              text: {
                type: 'plain_text',
                text: '12 hours'
              }
            },
            {
              value: '24',
              text: {
                type: 'plain_text',
                text: '24 hours'
              }
            },
            {
              value: '72',
              text: {
                type: 'plain_text',
                text: '3 days'
              }
            },
            {
              value: '168',
              text: {
                type: 'plain_text',
                text: '7 days'
              }
            },
            {
              value: '720',
              text: {
                type: 'plain_text',
                text: '30 days'
              }
            }
          ]
        }
      },
      {
        block_id: 'stats_type',
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'What type of stats would you like to generate?'
        },
        element: {
          action_id: 'stats_type',
          type: 'static_select',
          initial_option: {
            value: 'triage',
            text: {
              type: 'plain_text',
              text: 'Triage (report on specific emojis)'
            }
          },
          options: [
            {
              value: 'triage',
              text: {
                type: 'plain_text',
                text: 'Triage (report on specific emojis)'
              }
            },
            {
              value: 'generic',
              text: {
                type: 'plain_text',
                text: 'Generic (report on all emoji reactions)'
              }
            }
          ]
        }
      }
    ]
  }
}
