import {
  APIGatewayProxyResult,
  APIGatewayEvent,
  APIGatewayProxyEvent,
} from 'aws-lambda';
import { ApigateWayProxyResult, addCorsHeader, createId } from '../share/util';
import { BlogPost } from './BlogPost';
import { BlogPostService } from './BlogPostService';
import {
  APIGatewayClient,
  GetExportCommand,
} from '@aws-sdk/client-api-gateway';

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

  const item: BlogPost | null = await blogPostService.getBlogPostById(id);

  response = ApigateWayProxyResult(200, item);
  addCorsHeader(response);
  return response;
};

export const blogPostDeleteHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  var response: APIGatewayProxyResult;

  const id = event.pathParameters!.id!;

  await blogPostService.deleteBogPostById(id);

  const returnObject = {
    object: id,
    action: 'DELETE',
  };

  response = ApigateWayProxyResult(200, returnObject);
  addCorsHeader(response);
  return response;
};

export const apiDocsHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const ui = event?.queryStringParameters?.ui;

  const apigateway = new APIGatewayClient({});
  const restapiId = process.env.API_ID!;
  const getExportCommand = new GetExportCommand({
    restApiId: restapiId,
    exportType: 'swagger',
    accepts: 'application/json',
    stageName: 'prod',
  });

  const api = await apigateway.send(getExportCommand);
  const response = Buffer.from(api.body!).toString('utf-8');

  if (!ui) {
    return {
      statusCode: 200,
      body: response,
    };
  }

  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="SwaggerUI"
    />
    <title>SwaggerUI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
  </head>
  <body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: 'api-docs',
        dom_id: '#swagger-ui',
      });
    };
  </script>
  </body>
  </html>`;

  return {
    statusCode: 200,
    body: html,
    headers: {
      'Content-type': 'text/html',
    },
  };
};
