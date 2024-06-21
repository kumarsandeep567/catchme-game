# For our Frontend, we'll create a multi-stage build
# The first stage is the `BUILDER` stage where
# we compile our source code.
# In the second stage, the `FINAL` stage,
# we take our compiled source code and serve it
# using Nginx.

###########
# BUILDER #
###########

# Node base image
FROM node:15.2.0-alpine as builder

# Set working directory
WORKDIR /usr/src/app

# Instead of copying the entire node_modules directory,
# add /usr/src/app/node_modules/.bin to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# Ensure node_modules is mentioned in .dockerignore

# Copy React app to /usr/src/app/ 
# and cache the app dependencies
COPY ./ /usr/src/app/
RUN npm ci

# Run this only if `react-scripts` is missing 
#RUN npm install react-scripts@4.0.0 --silent

# Set environment variables
ARG REACT_APP_API_SERVICE_URL
ENV REACT_APP_API_SERVICE_URL $REACT_APP_API_SERVICE_URL
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

# Copy the files and start the build
COPY . .
RUN npm run build

#########
# FINAL #
#########

# Nginx Base image
FROM nginx

# If you have a custom Nginx configuration file,
# then run these commands.
#RUN rm -rf /etc/nginx/conf.d
#COPY conf /etc/nginx

# Copy the build files from the BUILDER stage
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Remember to map external port to the container's 
# port 80
EXPOSE 80

# Run nginx
# Nginx uses the daemon off directive to run in the foreground. 
# This makes it easy to run in debug mode (foreground) and directly switch 
# to running in production mode (background) by changing command line args.
# But, as of 22 October 2019, official Nginx docker images all have line:
# So, don't need to specify it in our Dockerfile.
#CMD ["nginx", "-g", "daemon off;"]