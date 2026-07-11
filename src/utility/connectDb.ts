import mongoose from "mongoose";

const connectDatabase = (port: number, host: string, name: string) => {
  const dbUrl: string = `mongodb://${host}:${port}/${name}`;
  mongoose
    .connect(dbUrl,{
      maxPoolSize: 1,
      minPoolSize: 1,
      // serverSelectionTimeoutMS: 1000
        waitQueueTimeoutMS: 1000

    })
    .then(() => {
      console.log("[ DB ] connected successfully.");
    })
    .catch((err: Error) => {
      console.error(err.message);
    });
};

export default connectDatabase;