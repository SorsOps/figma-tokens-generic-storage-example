import app from './app';

const PORT = process.env.PORT || 8000;

async function start() {
	await app.listen(PORT);
	console.log(`App started on ${PORT}`);
}

start();
