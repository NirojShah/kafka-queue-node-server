class ResponseType {
  statusCode: number;
  message: string;
  data: any;

  constructor(statusCode: number, message: string, data: any) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }
}

export default ResponseType;
