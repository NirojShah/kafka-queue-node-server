import dotenv from "dotenv";

function configureEnv(environment: string): void {
  let file: string = "";
  console.log(environment)
  switch (environment) {
    case "dev": {
      file = "./src/utility/.env.dev";
      break;
    }
    case "prod": {
      file = "./src/utility/.env.prod";
      break;
    }
    case "test": {
      file = "./src/utility/.env.testing";
      break;
    }
  }

  console.log(file);
  dotenv.config({
    path: file
  });
}

export default configureEnv;
