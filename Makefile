imagename=testable-lambda-example
docker-compose-cmd=docker-compose -f ./docker-compose.integration.test.yml

.PHONY: docker-build

docker-build:
	@docker build --target=dev -t $(imagename) .
	@docker build --target=test-runner -t $(imagename)-test-runner .

docker-test: docker-build
	@$(docker-compose-cmd) up --force-recreate --abort-on-container-exit --remove-orphans && $(docker-compose-cmd) down

clean:
	rm -rf localstack/
	rm -rf node_modules/