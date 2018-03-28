Test and demonstrate annotate packages.

# Building

```
$ git clone https://github.com/Xyfir/annotate.git
$ cd annotate/tests
$ npm install
$ webpack-cli
$ node src/server
```

Then navigate to `localhost:2061` in your browser, and open up the console.

From there you can play around with the basic reader and cycling through the mock annotation sets.

If you wish to modify the code and test changes, please be aware of how the build system and dependencies in these packages work. This is explained in the root README file.