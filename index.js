'use strict';

const serialize = require('serialize-error');
const AWS = require('aws-sdk');
const moment = require('moment');

let S3;

const getS3Connection = () => {
  if(S3) {
    return S3;
  }

  if(process.env.TEST_MODE) {
    console.log('[DEBUG] Running in test mode');

    S3 = new AWS.S3({
      // the following is required if running lambda using the docker executor
      endpoint: new AWS.Endpoint(`http://${process.env.LOCALSTACK_HOSTNAME}:4566`),
      accessKeyId: 'identity',
      secretAccessKey: 'credential',
      s3ForcePathStyle: true
    });

    console.log('[DEBUG] blahonga');
    return S3;
  }

  S3 = new AWS.S3();
  return S3;
}

const getObject = async ({Key, Bucket}) => {
  return await getS3Connection().getObject({
    Key,
    Bucket
  }).promise();
}

const putObject = async ({Key, Bucket, Body}) => {
  return await getS3Connection().putObject({
    Key,
    Bucket,
    Body
  }).promise();
}

exports.handler = async (event, context) => {
  try {
    const { bucket, object } = event.Records[0].s3;

    console.log(`[DEBUG] Reading s3://${bucket.name}/${object.key}`);
    const {Body} = await getObject({ Key: object.key, Bucket: bucket.name });

    const date = moment().format('YYYY/MM/DD');

    console.log(`[DEBUG] Exporting to s3://${process.env.BUCKET}/${date}/${object.key}`);
    await putObject({Key: `${date}/${object.key}`, Bucket: process.env.BUCKET, Body});

    console.log(`[DEBUG] done!`);
    return {message: `parsed ${object.key}`};
  }
  catch (error) {
    console.log(JSON.stringify({
      time : new Date().toISOString(),
      level: 'ERROR',
      message: 'Could not update item(s)',
      awsRequestId: context.awsRequestId,
      meta: serialize(event),
      error: serialize(error)
    }));

    throw error;
  }
};
