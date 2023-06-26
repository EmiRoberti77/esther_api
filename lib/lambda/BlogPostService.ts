import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { BlogPost } from './BlogPost';

export class BlogPostService {
  private tableName: string;
  private dbClient: DynamoDBClient;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.dbClient = new DynamoDBClient({});
  }

  async saveBlogPost(blogpost: BlogPost): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: marshall(blogpost),
    };

    const coommannd = new PutItemCommand(params);
    await this.dbClient.send(coommannd);
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    const params = {
      TableName: this.tableName,
    };

    const command = new ScanCommand(params);
    const response = await this.dbClient.send(command);
    const items = response.Items ?? [];
    return items.map((item) => unmarshall(item) as BlogPost);
  }

  async getBlogPostById(id: string): Promise<BlogPost | null> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ id: id }),
    };

    const command = new GetItemCommand(params);
    const response = await this.dbClient.send(command);
    const item = response.Item;
    if (!item) {
      return null;
    }
    return unmarshall(item) as BlogPost;
  }
}
