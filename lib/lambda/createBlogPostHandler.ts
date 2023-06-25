import {
  APIGatewayProxyResult,
  APIGatewayEvent,
  APIGatewayProxyEvent,
} from 'aws-lambda';
import { ApigateWayProxyResult, addCorsHeader, createId } from '../share/util';
import { BlogPost } from './BlogPost';
import { BlogPostService } from './BlogPostService';
import { APIGateway } from 'aws-sdk';

const TABLE_NAME = process.env.TABLE_NAME!;
const blogPostService = new BlogPostService(TABLE_NAME);

export const createBlogPostHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const blogpost: BlogPost = JSON.parse(event.body!);
  blogpost.id = createId();
  blogpost.createdAt = new Date().toISOString();

  await blogPostService.saveBlogPost(blogpost);
  const response = ApigateWayProxyResult(201, blogpost);

  addCorsHeader(response);
  return response;
};

export const getBlogPostByName = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  var response: APIGatewayProxyResult;
  let blogs: BlogPost[] = await blogPostService.getAllBlogPosts();
  let sort: string;
  if (event?.queryStringParameters) {
    if ('sort' in event.queryStringParameters) {
      sort = event.queryStringParameters['sort']!;

      if (sort === 'asc') {
        //sort code in Ascending
        blogs = blogs.sort((blogA, blogB) =>
          blogA.createdAt.localeCompare(blogB.createdAt)
        );
      } else {
        //sort code in Descending
        blogs = blogs.sort((blogA, blogB) =>
          blogB.createdAt.localeCompare(blogA.createdAt)
        );
      }
    }
  }

  response = ApigateWayProxyResult(200, blogs);
  addCorsHeader(response);
  return response;
};

export const blogpostgetById = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  let response: APIGatewayProxyResult;

  const id = event.pathParameters!.id!;

  response = ApigateWayProxyResult(200, id);
  addCorsHeader(response);
  return response;
};
