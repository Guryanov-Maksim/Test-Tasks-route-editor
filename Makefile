install: install-deps

start:
	npx webpack serve

install-deps:
	npm ci

deploy:
	git push heroku