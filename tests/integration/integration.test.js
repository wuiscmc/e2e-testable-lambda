'use strict';
const AWS = require('aws-sdk');

const {expect} = require('chai');
const createZipBuffer = require('./createZipBuffer');
const {promisify} = require('util');
const sleep = promisify(setTimeout);

const lambdaConnection = new AWS.Lambda({
  apiVersion: '2015-03-31',
  accessKeyId: 'identity',
  secretAccessKey: 'credential',
  endpoint: new AWS.Endpoint(`http://localstack:4566`)
});

const S3 = new AWS.S3({
  endpoint: 'http://localstack:4566',
  accessKeyId: 'identity',
  secretAccessKey: 'credential',
  s3ForcePathStyle: true
});

const createBucketNotification = async (lambdaArn, bucket) => {
  const params = {
    Bucket: bucket,
    NotificationConfiguration: {
      LambdaFunctionConfigurations: [
        {
          Events: [ 's3:ObjectCreated:*' ],
          LambdaFunctionArn: lambdaArn,
        },
      ],
    }
  };

  await S3
    .putBucketNotificationConfiguration(params)
    .promise();
};

const createBucket = async (Bucket) => {
  try {
    await S3.createBucket({ Bucket }).promise();
  } catch (error) {
    console.log(`[ERROR] S3 bucket ${Bucket} might already exist`);
  }
}

const createLambda = async () => {
  try {
    return await lambdaConnection
      .createFunction({
        Handler: 'index.handler',
        FunctionName: 'testable-lambda-fn',
        Runtime: 'nodejs14.x',
        Role: 'role',
        Code: {
          ZipFile: createZipBuffer()
        },
        Environment: {
          Variables: {
            AWS_FAKE_ENDPOINT: process.env.AWS_FAKE_ENDPOINT,
            BUCKET: process.env.DEST_BUCKET
          }
        }
      })
      .promise();
  } catch(error) {
    console.log(error);
  }
}

const provision = async () => {
  const {FunctionArn} = await createLambda();
  console.log('created lambda', FunctionArn);
  await Promise.all([
    createBucket(process.env.SOURCE_BUCKET),
    createBucket(process.env.DEST_BUCKET)
  ]);
  console.log('created buckets');
  await createBucketNotification(FunctionArn, process.env.SOURCE_BUCKET);
  console.log('created notification');
};

const putTestItem = async (body) => {
  return await S3.putObject({
    Bucket: process.env.SOURCE_BUCKET,
    Key: 'test',
    Body: JSON.stringify(body)
  }).promise();
}

let maxNumberRetries = 5;
const getObjectWithRetry = async ({Bucket, Key}) => {
  await sleep(5000);

  try {
    return await S3
      .getObject({ Bucket, Key })
      .promise();
  } catch(error) {
    if(maxNumberRetries === 0) {
      throw error;
    }
    console.log(`[INFO] s3://${Bucket}/${Key} not found, trying again`);
    maxNumberRetries -= 1;
    await sleep(5000);
    return await getObjectWithRetry({Bucket, Key});
  }
}

describe('integration tests', () => {
  before(async () => {
    await provision();
  });

  it('should succeed on the execution of the lambda', async () => {
    const object = {amazingKey: 'amazingValue'};
    await putTestItem(object);
    const {Body} = await getObjectWithRetry({
      Bucket: process.env.DEST_BUCKET,
      Key: 'test',
    });
    console.log(Body.toString('utf-8'));
  });
});
