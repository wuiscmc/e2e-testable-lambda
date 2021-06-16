'use strict';

const http = require('http');
const url = require('url');
const AdmZip = require('adm-zip');
const AWS = require('aws-sdk');

const port = process.env.HTTP_SERVER_PORT || 80;

let lambdaConnection;
let lambdaFunction;

const getLambdaConnection = () => {
  if (lambdaConnection) {
    return lambdaConnection;
  }

  lambdaConnection = new AWS.Lambda({
    apiVersion: '2015-03-31',
    accessKeyId: 'identity',
    secretAccessKey: 'credential',
    endpoint: 'http://localstack:4566',
    region: process.env.AWS_REGION
  });

  return lambdaConnection;
};

const getLambda = async () => {
  if(lambdaFunction) {
    console.log('Returning Lambda from memory cache');
    return lambdaFunction;
  }

  console.log('Zipping files');

  const zip = new AdmZip();

  zip.addLocalFolder('/app/node_modules', './node_modules');
  zip.addLocalFile('/app/index.js', './');

  const ZipFile = zip.toBuffer();

  console.log('Creating Function');

  lambdaFunction = await getLambdaConnection()
    .createFunction({
      Handler: 'index.handler',
      Environment: {
        Variables: {
          TEST_MODE: 'true',
        }
      },
      FunctionName: 'TestableLambda-Lambda-' + Date.now(),
      Runtime: 'nodejs14.x',
      Role: 'role',
      Code: {
        ZipFile
      }
    })
    .promise();

  console.log('Function created', lambdaFunction);
  return lambdaFunction;
};

const createSourceMapping = async (streamArn) => {
  await getLambda();

  const lambdaParams = {
    EventSourceArn: streamArn,
    Enabled: true,
    StartingPosition: 'LATEST'
  };

  console.log('Creating source mapping: ', lambdaParams);

  await getLambdaConnection().createEventSourceMapping(lambdaParams).promise();
};

const server = http.createServer();

server.on('request', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const myUrl = url.parse(req.url, true);

  let response = '';
  try {
    switch (myUrl.pathname) {
      case '/test':
        console.log(myUrl.query, myUrl.path);
        response = 'YEAH';
        break;

      case '/createSourceMapping':
        const {arn} = myUrl.query;
        console.log('Mapping: creating for ', arn);
        await createSourceMapping(arn);
        console.log('Mapping: mapped ', arn);
        response = 'done';
        break;

      case '/arn':
        console.log('Arn: requested lambda arn');
        response = JSON.stringify({
          arn: (await getLambda()).FunctionArn
        });

        break;

      default:
        response = 'OOUPS';
    }

    res.writeHead(200);
  } catch (error) {
    console.log(error);
    res.writeHead(400);
    response = error;
  }

  res.end(response || 'DONE');
});

server.listen(port, () => {
  console.log('Listening on port ' + port);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('shutting down');
    process.exit(0);
  });
});
