# Express & React, A Love Story

We have many options to serve our applications we will take a look at one way to serve our front-end and our back-end.

## Express Hosted

Example in the `express-hosted` folder.

### Requirements

Before we can think about how to let our applications interact with each other we need to find out what are our requirements (developer) and what are the requirements of our applications.

#### Developer

- Development Environment (should easily run on our machine)
- Production Environment (should with modification be deployable)

#### Express

- needs the node.js runtime / needs to be served from a server

#### React

- can be served from any static file server

### Production Environment

> Deploy often, deploy early

This is a good mantra to keep, it is tempting and completely normal to skip the deployment when you are in the early days of your development career. But when you start with an application where your target is to deploy it somewhen it is a good idea to start early with that. There are many reasons that we can sum them up with: "You need to think about two environments, your development and your production one"

- Express needs the node.js runtime so we need a server that supports this
- React is the uncomplicated of the two, it's just static files. The runtime is the browser and therefore out of our concern

#### Express

Let's take a look at a new (cleaned up) express app generated with express-generator.

```shell
backend
├── app.js
├── bin
│   └── www
├── package.json
└── public
```

The `public` folder looks really interesting. The folder itself does not provide any features but in combination with this line in `app.js` it becomes a static file hoster:

```js
app.use(express.static(path.join(__dirname, "public")));
```

![Combining the impossible](https://media.giphy.com/media/APqEbxBsVlkWSuFpth/giphy-downsized.gif)

Let's keep that in mind.

#### React

To know what we need to deploy we need to run `npm run build` or the react scripts `react-scripts build` and inspect the build folder:

```shell
build
├── asset-manifest.json
├── favicon.ico
├── index.html
├── logo192.png
├── logo512.png
├── manifest.json
├── precache-manifest.69666edb517f3df19eb7b679872aa63c.js
├── robots.txt
├── service-worker.js
└── static
    └── js
        ├── 2.47036fa4.chunk.js
        ├── 2.47036fa4.chunk.js.LICENSE.txt
        ├── 2.47036fa4.chunk.js.map
        ├── main.a6a39374.chunk.js
        ├── main.a6a39374.chunk.js.map
        ├── runtime-main.c4f1d106.js
        └── runtime-main.c4f1d106.js.map
```

That's it this is your react application. Just a bunch of files that we need to serve statically.

### Combine

The first thought might be to just copy the content of `front-end/build` into `back-end/public` and et voilà...

Not so quick... remember our mantra "Deploy often, deploy early" do we really want to do this every time. Deploying should be easy because if it is not we do it less often and when we do it less often it becomes even harder.

We can solve that by changing our static middleware to this directory and we never need to look back.

If we run now our express backend and visit http://localhost:3000 you can see our react app gets served 🎉🎉🎉

Thanks to morgan logging middleware you should see something like the following in your terminal (here simplified):

```shell
GET /
GET /static/js/2.47036fa4.chunk.js
GET /static/js/main.a6a39374.chunk.js
GET /api
GET /manifest.json
GET /logo192.png
```

- browser requests `/`
- we don't have a `/` handler registered but our static folder has an index.html so express serves this
- the index.html hits the browser and starts to download the assets (js chunks)
- the chunks execute and our `fetch("/api")` gets executed as well
- express does not find a `/api` folder in the static middleware
- our handler gets executed and replies with `{data: ...}`

### The missing parts

So far so good, but we solved some problems but we also created new ones:

We want a nice Developer experience with hot reload and shit. More on this later in the [**Development Environment** section](#development-environment)

Deploying should be easy but `front-end/build` is not even in our git repo, so how does that make things easy?

On this point, we could talk about CI/CD (continuous integration / continuous deployment) pipeline tools to build and ship our app. For now, all that we need is some solution that let's do us the following:

1. install node_modules for front-end and back-end
2. build react application
3. start express app

We can achieve this with a small shell script or even simpler a package.json in our root folder ("express-hosted")

1. Install Dependencies

   ```json
   {
     "scripts": {
       "install-dependencies": "npm i --prefix ./front-end && npm i --prefix ./back-end"
     }
   }
   ```

   Is an easy solution, we can use the --prefix to run npm commands in a subdirectory. The bad part with this is the installation of the `back-end` dependencies needs to wait for the front-end, we can do better / faster.

   With the [npm-run-all](https://www.npmjs.com/package/npm-run-all) package we can decide what we want to run sequentially and what we want to run in parallel. It has also this nice feature of using globs to represent a group of tasks.

   ```json
   {
     "scripts": {
       "install-deps:front-end": "npm i --prefix ./front-end",
       "install-deps:back-end": "npm i --prefix ./back-end",
       "install-deps": "run-p install-deps:*"
     }
   }
   ```

   If we run now `npm run install-deps` we install our dependencies for the front and back-end at the same time, feel the speed 🏃‍♀️💨

2. Build the react app

   This step needs to wait for the dependencies to be installed the command `npm-run-all` allows us to run multiple steps in a sequence. So we create a start script in which we control the complete sequence.

   `"start": "npm-run-all install-deps"` at this point in time we just have our `install-deps` task now let's create a task to build the front-end.

   `"build:front-end": "npm run build --prefix ./front-end"` now we can add this to our start sequence.

   All scripts:

   ```json
   {
     "install-deps:front-end": "npm i --prefix ./front-end",
     "install-deps:back-end": "npm i --prefix ./back-end",
     "install-deps": "run-p install-deps:*",
     "build:front-end": "npm run build --prefix ./front-end",
     "start": "npm-run-all install-deps build:front-end"
   }
   ```

3. Start express app

   Thats a low hanging fruit: `npm run start --prefix ./back-end`

   ```json
   {
     "install-deps:front-end": "npm i --prefix ./front-end",
     "install-deps:back-end": "npm i --prefix ./back-end",
     "install-deps": "run-p install-deps:*",
     "build:front-end": "npm run build --prefix ./front-end",
     "start:back-end": "npm run start --prefix ./back-end",
     "start": "npm-run-all install-deps build:front-end start:back-end"
   }
   ```

You may notice that even we just need to build the front-end or we just need to start the back-end we still used here the `action:what` syntax. Just because we don't know how our app will develop. Later we might add a `build:back-end` script. In our start script, we could then simply write `start:*`. It might feel like premature optimization. But it is nice when all your scripts have the same naming convention across repositories. And this is kind of my standard, find yours :)

### Development Environment

At this point, the development process might feel broken to you. Building every time the front-end is a pain and not an option. No hot-reload no love!

To get the best of both we want to start them individually.

Let's create development scripts for both. In the back-end, I have added nodemon for a better experience (reload express server on changes).

```json
{
  "dev:front-end": "npm run start --prefix ./front-end",
  "dev:back-end": "npm run dev --prefix ./back-end"
}
```

If we add the following: if we try to run the following `run-p dev:*` we get a notification that something is already running on port 3000 because by default express and react want to claim port 3000 for them. Let's fix this.

```json
{
  "dev:front-end": "npm run start --prefix ./front-end",
  "dev:back-end": "PORT=4000 npm run dev --prefix ./back-end",
  "dev": "run-p dev:*"
}
```

Now our backend runs on port 4000. Now the scripts start but our front-end can not fetch the data. 😩 Will this ever end. Yes, thanks to create react apps proxy property.

The problem: We want both apps separated so they need to claim different ports. But this is just true for the development environment. We could fix this in our app by fetching data like:

```js
fetch("http://localhost:4000/api");

// instead of

fetch("/api");
```

But that would break the production environment. Our app should be domain agnostic.

By adding the following to our `/front-end/package.json`:

```json
{
  "proxy": "http://localhost:4000"
}
```

The development server is now creating a proxy server for our express app. So for the browser, they become one.

Important is the port of your proxy parameter need to be the same with the PORT environment variable of your `dev:back-end` script.
