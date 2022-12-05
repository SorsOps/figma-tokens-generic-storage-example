module.exports = {
	coverageDirectory: '<rootDir>/jest-coverage',
	collectCoverage: true,
	collectCoverageFrom: [
		'<rootDir>/packages/**/src/**.{js,jsx,ts,tsx}',
		'!<rootDir>/.storybook/**',
		'!<rootDir>/config/**'
	],
	coverageReporters: ['json'],
	coveragePathIgnorePatterns: ['!*.d.ts'],
	moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
	moduleNameMapper: {
		// Yes this needs to be first. Jest is very stupid when it comes to the correct ordering of module name mapping.

		// Yes it should be an array to ensure consistency, but jest does not offer this
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/tests/__mocks__/file-mock.js',
		'.+\\.(css|less|scss|sass|styl)$': 'identity-obj-proxy',
		prefix: '<rootDir>/'
	},
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},
	reporters: [
		'default',
		[
			'jest-junit',
			{ outputDirectory: '<rootDir>/jest-coverage', outputName: 'junit.xml' }
		]
	],
	globals: {
		__PATH_PREFIX__: ''
	},
	rootDir: './'
};
