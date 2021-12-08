'use strict';

module.exports = (
  {
    timestamp = '1532956703090',
  } = {}
) => {
  return {
    Records: [
      {
        dynamodb: {
          Keys: {
            userId_sectionId: {
              S: 'blahonga::default'
            },
            guid: {
              S: 'test-show'
            }
          },
          SizeBytes: 259,
          StreamViewType: 'NEW_AND_OLD_IMAGES',
          NewImage: {
            userId_sectionId: {
              S: 'blahonga::default'
            },
            ts: {
              N: timestamp
            },
            guid: {
              S: 'test-show'
            },
            meta: {
              S: 'woho!'
            }
          }
        },
        eventName: 'MODIFY'
      }
    ]
  };
};
