FROM node:14

LABEL name="typeofweb-bundlephobia-pr-stats-action"
LABEL maintainer="Michal Miszczyszyn <michal@mmiszy.pl>"
LABEL version="0.0.1"
LABEL repository="https://github.com/typeofweb/typeofweb-bundlephobia-pr-stats-action"
LABEL homepage="https://github.com/typeofweb/typeofweb-bundlephobia-pr-stats-action"

LABEL com.github.actions.name="Type of Web Bundlephobia PR stats"
LABEL com.github.actions.description="Compare bundle size for Pull Requests"
LABEL com.github.actions.color="green"
LABEL com.github.actions.icon="bar-chart-2"

COPY dist /dist
ENTRYPOINT ["node", "/dist/index.js"] 
