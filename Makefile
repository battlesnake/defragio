.PHONY: deploy
deploy:
	npm run deploy

.PHONY: status
status:
	npm run deploy:status

.PHONY: serve
serve:
	python -m http.server 1234
