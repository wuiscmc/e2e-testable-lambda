'use strict';
const AWS = require('aws-sdk');
// const {expect} = require('chai');

const buildRecord = require('./buildRecord');
const createZipBuffer = require('./createZipBuffer');
const {promisify} = require('util');
const sleep = promisify(setTimeout);

const lambda = new AWS.Lambda({
	apiVersion: '2015-03-31',
	accessKeyId: 'identity',
	secretAccessKey: 'credential',
	endpoint: `http://localstack:4566`
});

const invokeLambdaFunction = async (record) => {
	return await lambda
		.invoke({
			FunctionName: 'testable-lambda-fn',
			InvocationType: 'RequestResponse',
			Payload: JSON.stringify(record)
		})
		.promise();
};

describe('integration tests', () => {
	before(async () => {		
		await lambda
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
						// TABLE_NAME: tableName,
						TEST_MODE: 'true'
					}
				}
			})
			.promise();
	});
	
	it('should succeed on the execution of the lambda', async () => {			
		await invokeLambdaFunction(buildRecord());
	});
	
	after(async () => {
		await lambda
			.deleteFunction({
				FunctionName: 'testable-lambda-fn'
			})
			.promise();
	});
});
