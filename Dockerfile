FROM		node:17-alpine3.12

WORKDIR		/usr/app

COPY 		. .

RUN			yarn global add ts-node

RUN			yarn install

ENTRYPOINT [ "yarn", "start" ]
