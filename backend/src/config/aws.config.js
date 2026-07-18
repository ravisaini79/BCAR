const { S3Client } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'eu-north-1';
const bucketName = process.env.AWS_BUCKET_NAME || 'bcarbankmitra-assets';

const s3Config = {
  region
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

const s3Client = new S3Client(s3Config);

module.exports = {
  s3Client,
  BUCKET_NAME: bucketName,
  AWS_REGION: region
};
