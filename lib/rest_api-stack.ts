import { Stack, StackProps } from 'aws-cdk-lib';
import {
  Cors,
  LambdaIntegration,
  ResourceOptions,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import {
  AttributeType,
  Table,
  TableEncryption,
} from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { existsSync } from 'fs';
import { join } from 'path';

export class RestApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const createBlogPostHandler = 'createBlogPostHandler';
    const getBlogPostByName = 'getBlogPostByName';

    const blogPostApi = 'blogPostApi';
    const BLOGPOSTS = 'blogposts';
    const blogPostTable = 'blogPostTable';
    const blogpostgetById = 'blogpostgetById';

    //create path to poat lambda
    const pathToPostBlogLambda = join(
      __dirname,
      '..',
      'lib',
      'lambda',
      'createBlogPostHandler.ts'
    );
    if (!existsSync(pathToPostBlogLambda)) {
      console.log(pathToPostBlogLambda, 'NOT FOUND');
      console.log('exiting constructor');
      return;
    }

    console.log(pathToPostBlogLambda, 'ALL GOOD - PATH FOUND');

    //create restapi

    const api = new RestApi(this, blogPostApi);

    //create blog post table
    const table = this.createTable(blogPostTable);
    //create lambda
    const createBlogPostLambda = this.createLambda(
      pathToPostBlogLambda,
      createBlogPostHandler,
      createBlogPostHandler,
      table.tableName
    );
    //create get blog by name Lanbda
    const getLambdaByName = this.createLambda(
      pathToPostBlogLambda,
      getBlogPostByName,
      getBlogPostByName,
      table.tableName
    );

    //create lambda get post by id
    const getBlogPostById = this.createLambda(
      pathToPostBlogLambda,
      blogpostgetById,
      blogpostgetById,
      table.tableName
    );

    //Cors settings
    const optionsWithCors: ResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    };

    //add read write permission to lambda for table
    table.grantFullAccess(createBlogPostLambda);
    table.grantReadData(getLambdaByName);
    table.grantReadData(getBlogPostById);

    createBlogPostLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [table.tableArn],
        actions: ['*'],
      })
    );

    getLambdaByName.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [table.tableArn],
        actions: ['*'],
      })
    );

    getBlogPostById.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [table.tableArn],
        actions: ['*'],
      })
    );

    //attach a path to api /blogposts
    const blogPostPath = api.root.addResource(BLOGPOSTS, optionsWithCors);
    blogPostPath.addMethod('POST', new LambdaIntegration(createBlogPostLambda));
    blogPostPath.addMethod('GET', new LambdaIntegration(getLambdaByName));
    const blogPostById = blogPostPath.addResource('{id}');
    blogPostById.addMethod('GET', new LambdaIntegration(getBlogPostById));
  }

  createTable(blogPostTable: string) {
    const table = new Table(this, blogPostTable, {
      tableName: blogPostTable,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
    });

    return table;
  }

  createLambda(
    entry: string,
    handler: string,
    functionName: string,
    tabelName: string
  ) {
    const createBlogPostLambda = new NodejsFunction(this, functionName, {
      entry,
      handler,
      functionName,
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: tabelName,
      },
    });

    return createBlogPostLambda;
  }
}
