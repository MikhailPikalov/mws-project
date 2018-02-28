# MWS Project / Stage 1

## Requirements

**Node.js** version `8.9.0`, but might work with earlier versions.


## Installation notes

`npm install`

Installation of **ImageMagick** or **GraphicsMagick** is not required, since all optimized and resized images are already included (see [Build/Images](#images)).


## Build

Build process is controlled with `gulp`, and its config is located in file `gulp/config.js`.
Everything is built into **`/build/`** directory and server must be run from there.

There are two commands, one is to build everything once, the other is to build and then watch source files for changes:

1. `npm run build` — Builds everything
2. `npm run watch` — Builds everything, and then watches for changes in `js`/`scss`/`html` files, changes in **`/assets/root/`** and **`/assets/images/processed/`** directories.

---

There are **3** build flags, which can be passed to either one of the build commands:

1. `--dev` / `--prod`
1.1. Applies minification if it is production.
1.2. Adds `.min` extention to filenames of `js` and `css` files if it is production.
1.3. Writes sourcemaps for `css` files if it is development.
1.4. Calculates separate hash for chunks in webpack if it is production.
*Note: `--prod` can be omitted, by default production version is used.*

2. `--analyze-js-bundle`
If present — runs [webpack bundle analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer) after build is complete.
*Note: Should be run with a `npm run build` command, since there is generally no need to continually analyze bundle after each build.*

3. `--source-maps`
If present, **enables** source maps in webpack build, slows scripts build process a little. Source maps for webpack are **disabled** by default.

Examples:
```
npm run watch -- --dev
npm run watch -- --dev --source-maps
npm run build -- --prod --analyze-js-bundle
```


#### Scripts

`Webpack` is run as one of the steps of the build process. Configuration file for webpack is located in root of the project in a file `webpack.config.js`.
Scripts (except service worker) are build into three chunks.

1. `vendor` chunk — es5 environment from transpiler and basically nothing else for now.
2. `index` chunk — code, specific to the index page
3. `restaurant` chink — same, but for restaurant page

Scripts are transpiled with `babel` into `ES5` code.
All resulting `js` files have its **hash** inserted into resulting filenames.
Webpack build also generates **`webpack-manifest.json`** file with the information about built files. This file is used later, to build **html** files and **service worker**.


#### Styles

`Sass` is used with its `scss` syntax.
There is only one resulting `css` file — `bundle[.min].css`.
`bundle.scss` file references all the files used in the build in the specific order: `scss` variables first, then `normalize`, then basic styles, then components and so on.
BEM-like naming is used for `css` classes.

There is an option `serializeCSSBundle` in the `gulp/config.js` file, which if set to `true` serializes contents of the bundle into `<style>` tag and puts is into `<head>` of resulting html pages.
By default it is set to `true`.
If it would be set to `false`, then `css` bundle will be linked to resulting **html** files in a regular way with the `<link>` tag.
This option also affects build of the **service worker**.

*Note: `gulp-sourcemaps` plugin is currently not working because of conflict with `gulp-autoprefixer` plugin, might be fixed in the near future, but for now css is without sourcemaps.*


#### HTML Pages

There is a list of pages (just 2 of them) in the `gulp/config.js` file, with a titles set for them.
Gulp task `generate-html` iterates over that list to generate these pages.

For each page it takes `layout.html` file as a template.

Then list of params is passed to `layout.html` through [`gulp-ejs`](https://www.npmjs.com/package/gulp-ejs) package.
Params include:

- name of page `html` file and the title of the page.
- hashed filenames of `js` files.
- hashed filename of `css` bundle or serialized content of it.
- google maps api key.

*Note: **Google maps key** is set it `gulp/config.js` file and limited to `localhost` domain.*


#### Service worker

Service worker is built in gulp task `generate-sw`.

- It uses parameter `cacheForeignResources` from `gulp/config.js` to decide if google maps resources need to be cached.
By default it is `false` and google maps resources are not cached in service worker.
- Uses parameter `serializeCSSBundle` to see if css bundle is serialized in content of pages and if the css bundle needs to be cached separately.
By default is is `true`, and service worker does not cache css bundle separately. If set to `false`, then it would read filename of css bundle from `styles-manifest.json` and cache it.
- Reads all names of `js` chunks from `webpack-manifest.json` to decide which `js`-files to cache.
- Reads directory `/assets/root/` for a list of icons/favicons/json/xml that also need to be cached.

Resulting service worker is located at the root of build directory `/build/sw.js`.

*Note: Transpiling is **not** used for service worker to greatly simplify its debugging, and therefore it is written with es5 syntax to avoid any problems with browsers that do support service worker, but not fully support es6 features or syntax.*


#### Images

Resized and optimized images are already included.
Original images directory: `/assets/images/src/`
Processed images directory: `/assets/images/processed/`

Build commands are simply **copying** already processed images to the `/build/assets/images/` directory.

It there is a need to resize+optimize them again, the command `npm run build-images` needs to be run.
For this command to correctly work, there needs to be installed either **ImageMagick** or **GraphicsMagick**.

Parameter `magick` in `gulp/config.js` chooses which one is used in the build process.

*Note: Tested only with **GraphicsMagick**, but should work with **ImageMagick** also.*




## Run

HTTP Server needs to be run from the **`/build/`** directory.

For the development was used Node.js server package [`serve`](https://www.npmjs.com/package/serve).
After its global installation it can be run with a command `serve -p 8000`.

Python server `python -m SimpleHTTPServer 8000` also works, but is scoring worse in the lighthouse audit.


## TLDR

1. `npm install`
2. `npm run build`
3. Start server on `localhost:8000` in `/build/` directory