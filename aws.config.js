const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = "ap-south-1";
const BUCKET = "amz-vid-bucket";

const createPresignedUrl = async ({ region, bucket, key }) => {
  const S3client = new S3Client({
    region: region,
    // Makes sure you add permission of fullsS3Access to the user you create
    credentials: {
      //can be found in IAM user , remember it must have permissions
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
  });

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const url = await getSignedUrl(S3client, command);

  return url;
};

function put(url, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      { method: "PUT", headers: { "Content-Length": new Blob([data]).size } },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve(responseBody);
        });
      }
    );
    req.on("error", (err) => {
      reject(err);
    });
    req.write(data);
    req.end();
  });
}

const putFileInAwsS3 = async () => {
  //key can be any name
  const KEY = "temp.mov";

  try {
    const clientUrl = await createPresignedUrl({
      region: REGION,
      bucket: BUCKET,
      key: KEY,
    });

    //content
    await put(clientUrl, "Hello World");
  } catch (err) {
    console.error(err);
  }
};

const getFileFromAwsS3 = async () => {
  const KEY = "temp.mov";

  try {
    const clientUrl = await createPresignedUrl({
      region: REGION,
      bucket: BUCKET,
      key: KEY,
    });

    return clientUrl;
  } catch (err) {
    console.error(err);
  }
};

module.exports = { getFileFromAwsS3, putFileInAwsS3 };
