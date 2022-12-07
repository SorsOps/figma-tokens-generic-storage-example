/* eslint-disable new-cap */
import {
	Body,
	Controller,
	Get,
	Post,
	Put,
	Query,
	Res,
	Response,
	Route,
	TsoaResponse
} from 'tsoa';

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

import fs from 'fs';
import path from 'path';

type Tokens = Record<string, any>;

interface PutRequest {
	/**
	 * The token set
	 */
	values: Tokens;
	/**
	 * The themes associated with the token set
	 */
	$themes?: Array<Tokens>;
	/**
	 * The time at which the changes were made
	 */
	updatedAt: Date | string;
	/**
	 * The version of the plugin that pushed the values
	 */
	version: string;
}

interface PutResponse {
	values: Tokens;
	$themes?: Array<Tokens>;
	/**
	 * The version of the plugin that pushed the values
	 */
	version: string;
	/**
	 * The date submitted in unix time
	 */
	updatedAt: number;
}

interface PostRequest {
	/**
	 * The initially populated token set
	 */
	values?: Tokens;
	/**
	 * The themes associated with the token set
	 */
	$themes?: Array<Tokens>;
	/**
	 * The version of the plugin that pushed the values
	 */
	version: string;

	/**
	 * The time at which the changes were made
	 */
	updatedAt?: Date | string;
}

interface PostResponse {
	/**
	 * Whether the token set was created or reused
	 */
	created: boolean;
	/**
	 * When the set was created
	 */
	updatedAt: number;
}

interface ValidateErrorJSON {
	message: 'Validation failed';
	details: { [name: string]: unknown };
}

// We are going to completely seperate Token sets by DBs

@Route(':tokenSet')
export class TokensController extends Controller {
	@Get('/')
	public async getTokens(
		tokenSet: string,
		@Res() notFoundResponse: TsoaResponse<404, { reason: string }>,
		@Query() version?: string
	): Promise<PutResponse> {
		const filePath = path.join(__dirname, `../../db/${tokenSet}.db`);
		if (!fs.existsSync(filePath)) {
			return notFoundResponse(404, { reason: 'Token set does not exist' });
		}

		const db = await open({
			//Using an anonymous db
			filename: filePath,
			driver: sqlite3.cached.Database
		});

		let response;

		if (!version) {
			// Get the latest
			response = await db.get(
				'SELECT updatedAt, json, themes, pluginVersion FROM Tokens GROUP BY updatedAt  ORDER BY max(updatedAt) LIMIT 1; '
			);
		} else {
			//Attempt to retrieve a specific version
			response = await db.get(
				'SELECT updatedAt, json, themes, pluginVersion FROM Tokens WHERE updatedAt = :updated; ',
				{
					':updated': version
				}
			);
		}

		if (!response) {
			return notFoundResponse(404, {
				reason: 'Version requested does not exist'
			});
		}

		const themes = JSON.parse(response.themes);

		const result: PutResponse = {
			values: JSON.parse(response.json),
			version: response.pluginVersion,
			updatedAt: new Date(response.updatedAt).getTime()
		};
		// Keep the response undefined if used
		if (themes) {
			result.$themes = themes;
		}
		return result;
	}
	@Put('/')
	@Response<ValidateErrorJSON>(400, 'Validation Failed')
	public async putTokens(
		tokenSet: string,
		@Body() requestBody: PutRequest,
		@Res() notFoundResponse: TsoaResponse<404, { reason: string }>
	): Promise<PutResponse> {
		const filePath = path.join(__dirname, `../../db/${tokenSet}.db`);
		if (!fs.existsSync(filePath)) {
			return notFoundResponse(404, { reason: 'Token set does not exist' });
		}
		const db = await open({
			//Using an anonymous db
			filename: filePath,
			driver: sqlite3.cached.Database
		});

		await db.run(
			'INSERT INTO Tokens (updatedAt, json, themes, pluginVersion) VALUES (:updated, :json,:themes,:version) RETURNING updatedAt;',
			{
				':updated': new Date(requestBody.updatedAt).getTime(),
				':json': JSON.stringify(requestBody.values),
				':themes': JSON.stringify(requestBody.$themes || []),
				':version': requestBody.version
			}
		);

		return {
			values: requestBody.values,
			$themes: requestBody.$themes,
			version: requestBody.version,
			updatedAt: new Date(requestBody.updatedAt).getTime()
		};
	}
	@Post('/')
	public async postTokens(
		tokenSet: string,
		@Body() requestBody: PostRequest
	): Promise<PostResponse> {
		let created = false;
		let updatedAt = requestBody.updatedAt
			? new Date(requestBody.updatedAt)
			: new Date();

		const filePath = path.join(__dirname, `../../db/${tokenSet}.db`);

		if (!fs.existsSync(filePath)) {
			created = true;
		}
		const db = await open({
			//Using an anonymous db
			filename: filePath,
			driver: sqlite3.cached.Database
		});

		if (created) {
			//Create the new initial structure
			await db.exec(
				'CREATE Table Tokens (updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, json TEXT, themes TEXT, pluginVersion varchar(255),PRIMARY KEY (updatedAt));'
			);


			if (requestBody.values) {
				await db.run(
					'INSERT INTO Tokens (updatedAt, json, themes, pluginVersion) VALUES (:updated,:json,:themes,:version);',
					{
						':updated': updatedAt.getTime(),
						':json': JSON.stringify(requestBody.values),
						':themes': JSON.stringify(requestBody.$themes || []),
						':version': requestBody.version
					}
				);
			}
		} else {
			//Request the latest

			const result = await db.get(
				'SELECT updatedAt FROM Tokens  GROUP BY updatedAt  ORDER BY max(updatedAt) LIMIT 1;'
			);
			console.log(result)
			updatedAt = new Date(result.updatedAt);
		}

		return {
			updatedAt: updatedAt.getTime(),
			created
		};
	}
}
