var pathSrcRoot          = 'app-client/source';
var pathDistRoot         = 'app-client/build-dev';
var pathNewDistCacheRoot = 'app-client/_build-cache';
var pathTempRoot         = 'app-client/_temp';

// 文件夹结构：
//
// {root}
//   ├─app-dev       <-- 这是开发源码（Development）文件夹
//   │  ├─html
//   │  ├─scripts
//   │  └─styles
//   │     └─base    <-- Reset通配定义、网站的基本定义、字体定义的css全放在这里，然后让gulp自动合并成base.min.css。
//   ├─app-dist      <-- 这是发布（Distribution）文件夹
//   │  ├─html
//   │  ├─scripts
//   │  └─styles
//   └─node_modules  <-- 这是node插件文件夹，纯粹供node使用，与最终前端产品毫无干系







var gulp = require('gulp');

var fileSystem = require('fs');   // Nodejs 自带的 FileSystem 模块。
var del = require('del'); // 用来删除文件，例如，总是在输出之前先删除所有旧版输出文件。每当文件改名时，确保不残留使用旧名字的文件。

var inject = require('gulp-inject');
var rename = require('gulp-rename'); // 方便的重命名文件
var changeContent = require('gulp-change'); // 方便的文件编辑插件
var concat = require('gulp-concat');
// var groupConcat = require('gulp-group-concat');

// var newerThan = require('gulp-newer');
var logFileSizes = require('gulp-size');

var sourcemaps = require('gulp-sourcemaps');

var eslint = require('gulp-eslint');

var uglifyJs = require('gulp-uglify');
// var cssnano = require('gulp-cssnano');
var cssmin = require('gulp-cssmin');
var htmlmin = require('gulp-htmlmin');


// 顺便说一下：
// 很显然，很多任务都是走的这样一个过程：
// 先找到一个或一些文件，然后对文件进行进一步操作。
// 而上述第一个动作中，匹配文件所用的字符串有一个专门的术语叫glob。
// 例如：
//    '/*.js'
//    '/**/*.css'
//    '!/**/*.css'
// 这些都叫做glob。







// 下面定义各种任务，特别是一个叫做 “default” 的任务。
// 当我们从命令行窗口输入gulp并回车时，gulp会自动从 default 任务开始执行。
// 当然，我们也可以指明执行某个任务，像这样：
//     gulp styles<回车>

// 不要忘记Gulp默认是令任务并行的。因此也不要忘记总是使用return语句返回gulp动作的返回值，
// 因为这些动作的返回值，是一个个Stream对象，返回这些Stream对象才能保证各个相互依赖的任务
// 依照预定顺序执行；否则，虽然任务可能会被执行，却不能保证依照预定顺序，从而可能造成晚期错误的结果。

gulp.task('before-everything', () => {
  console.log('           >>>>>>>>  Deleting old temp files...');
  return del([pathNewDistCacheRoot]);
});



var baseCssGlobs = [
  // 下面壹壹列出各个glob，目的是保证这些css文件合并的顺序。我们知道，错误的顺序将导致错误的结果。
  pathSrcRoot+'/styles/base/_reset*.css',
  pathSrcRoot+'/styles/base/iconfonts/*.css',
  pathSrcRoot+'/styles/base/_fonts*.css',
  pathSrcRoot+'/styles/base/base.css',
  pathSrcRoot+'/styles/base/layout.css',
];
var baseCssGlobsIngored = [];

baseCssGlobs.forEach((glob) => {
  baseCssGlobsIngored.push('!'+glob); //前面加一个惊叹号，代表忽略这个glob。
});

gulp.task('styles-base', ['before-everything'], () => {
  return gulp.src(baseCssGlobs)
    // .pipe(sourcemaps.init())
      .pipe(concat('base.min.css')) // 这些css我要合并成单一文件
      // .pipe(cssmin())
    // .pipe(sourcemaps.write('.'))

    .pipe(gulp.dest(pathNewDistCacheRoot+'/styles/base/')) // 将文件写入指定文件夹
  ;
});

gulp.task('styles-iconfonts', ['before-everything'], () => {
  return gulp.src([
    pathSrcRoot+'/styles/base/iconfonts/*',
    '!'+pathSrcRoot+'/styles/base/iconfonts/*.css', //前面加一个惊叹号，代表忽略这个glob。
  ])
    .pipe(gulp.dest(pathNewDistCacheRoot+'/styles/base/')) // 将文件写入指定文件夹
  ;
});


gulp.task('styles-dt-tech', ['before-everything'], () => {

  return gulp.src(
    [
      pathSrcRoot+'/fixed-income-rules_files/**/*.css'
    ]
  )
      // .pipe(rename((fullPathName) => {
      //   fullPathName.basename += '.min';
      //   return fullPathName;
      // }))

    .pipe(gulp.dest(pathNewDistCacheRoot+'/styles/dt-tech')) // 将文件写入指定文件夹
  ;
});

gulp.task('styles-specific', ['before-everything'], () => {
  return gulp.src(
    [
      pathSrcRoot+'/styles/**/*.css'
    ]
      .concat(baseCssGlobsIngored)
  )
    // .pipe(sourcemaps.init())
      // .pipe(concat('main.min.css')) // 这些css我不打算合并
      // .pipe(cssmin())
      .pipe(rename((fullPathName) => {
        fullPathName.basename += '.min';
        return fullPathName;
      }))
    // .pipe(sourcemaps.write('.'))

    .pipe(gulp.dest(pathNewDistCacheRoot+'/styles')) // 将文件写入指定文件夹
  ;
});

// 我的 styles 任务依赖我的3个前导任务： styles-base 、 styles-iconfonts 和 styles-specific
// 我的 styles 任务有一个无关紧要的动作，即打印所有css文件的总计大小。
// 实际上，该 styles 任务可以没有自己的动作，那样的话，其存在意义仅仅是将其所用前导任务打成一个任务包。
gulp.task('styles', [
  'styles-base',
  'styles-iconfonts',
  'styles-dt-tech',
  'styles-specific'
], () => {
  return gulp.src([
    pathNewDistCacheRoot+'/styles/**/*.css'
  ])
    .pipe(logFileSizes({title: '>>>>>>>>  Reporting Files:    CSS', showFiles: false})) // 为了装逼，在命令行窗口中打印一下文件尺寸
  ;
});



gulp.task('es-lint', ['before-everything'], () => {
  return gulp.src([
    pathSrcRoot+'/scripts/**/*.js',
    '!'+pathSrcRoot+'/scripts/vendors/**/*'
  ])
    .pipe(eslint())
    .pipe(eslint.format())
  ;
});

// 我的 scripts-unglify 任务须在 eslint 任务完成之后才可以开始。
// 虽然不先做 lint 代码审查，也可以同步压缩和输出脚本文件，但那样做意义不大。
// 更何况我们不希望未通过审查的新版代码覆盖旧版的代码。所以我故意这样安排。
gulp.task('scripts-unglify', ['es-lint'], () => {
  return gulp.src([
    pathSrcRoot+'/scripts/**/*.js',
    '!'+pathSrcRoot+'/scripts/vendors/**/*'
  ])
    // .pipe(sourcemaps.init())
      // .pipe(concat('base.min.js'))
      // .pipe(uglifyJs({preserveComments: 'some'}))
      .pipe(rename((fullPathName) => {
        fullPathName.basename += '.min';
        return fullPathName;
      }))
    // .pipe(sourcemaps.write('.'))

    .pipe(gulp.dest(pathNewDistCacheRoot+'/scripts')) // 将文件写入指定文件夹
  ;
});

gulp.task('scripts-vendors', ['before-everything'], () => {
  return gulp.src([
    pathSrcRoot+'/scripts/vendors/**/*'
  ])
    // .pipe(concat('vendors.min.js'))
    .pipe(gulp.dest(pathNewDistCacheRoot+'/scripts/vendors/')) // 将文件写入指定文件夹
  ;
});

gulp.task('scripts', ['scripts-unglify', 'scripts-vendors'], () => {
  return gulp.src([
    pathNewDistCacheRoot+'/scripts/**/*.js'
  ])
    .pipe(logFileSizes({title: '>>>>>>>>  Reporting Files:     JS', showFiles: false})) // 为了装逼，在命令行窗口中打印一下文件尺寸
  ;
});

gulp.task('html', ['before-everything'], () => {
  var shouldMinifyHTML = false;

  return gulp.src([
    pathSrcRoot+'/**/*.html'
  ])
    .pipe(htmlmin({
      preserveLineBreaks: !shouldMinifyHTML,
      collapseWhitespace: !!shouldMinifyHTML,

      removeComments: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: false,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      // removeOptionalTags: true
    }))

    .pipe(logFileSizes({title: '>>>>>>>>  Reporting Files:   HTML', showFiles: false})) // 为了装逼，在命令行窗口中打印一下文件尺寸
    .pipe(gulp.dest(pathNewDistCacheRoot)) // 将文件写入指定文件夹
  ;
});


gulp.task('fonts', ['before-everything'], () => {
  return gulp.src([
    pathSrcRoot+'/fonts/**/*'
  ])
    .pipe(logFileSizes({title: '>>>>>>>>  Reporting Files:  Fonts'})) // 为了装逼，在命令行窗口中打印一下文件尺寸
    .pipe(gulp.dest(pathNewDistCacheRoot+'/fonts')) // 将文件写入指定文件夹
  ;
});

gulp.task('images', ['before-everything'], () => {
  return gulp.src([
    pathSrcRoot+'/fixed-income-rules_files/**/*',
    pathSrcRoot+'/images/**/*'
  ])
    .pipe(logFileSizes({title: '>>>>>>>>  Reporting Files: Images'})) // 为了装逼，在命令行窗口中打印一下文件尺寸
    .pipe(gulp.dest(pathNewDistCacheRoot+'/images')) // 将文件写入指定文件夹
  ;
});



gulp.task('prepare-all-new-files-in-cache', [
  'fonts',
  'images',
  'styles',
  'scripts',
  'html'
]);



gulp.task('delete-old-dist', [
  'prepare-all-new-files-in-cache'
], () => {
  console.log('           >>>>>>>>  Deleting old distribution files...');

  return del([
    pathDistRoot,
  ]);
});


gulp.task('ship-cached-files', [
  'delete-old-dist'
], () => {
  var shouldCopyFilesInsteadOfRenameFolder = false;

  if (shouldCopyFilesInsteadOfRenameFolder) {

    console.log('           >>>>>>>>  Copying all files from "'+pathNewDistCacheRoot+'" to "'+pathDistRoot+'"...');
    return gulp.src([pathNewDistCacheRoot+'/**/*'])
      .pipe(gulp.dest(pathDistRoot)) // 将文件写入指定文件夹
    ;

  } else {

    console.log('           >>>>>>>>  Reanming "'+pathNewDistCacheRoot+'" folder into "'+pathDistRoot+'"...');
    fileSystem.renameSync(pathNewDistCacheRoot, pathDistRoot);

  }
});


gulp.task('finishing-after-shipping', [
  'ship-cached-files'
], () => {
  console.log('           >>>>>>>>  Deleting useless files...');

  return del([
    pathTempRoot
  ]);
});






gulp.task('build-entire-app', ['finishing-after-shipping'], () => {
  return gulp.src([pathDistRoot+'/**/*'])
    .pipe(logFileSizes({title: '=======>  Reporting Files:'})) // 为了装逼，在命令行窗口中打印一下文件尺寸
  ;
});

gulp.task('watch-dev-folder', ['finishing-after-shipping'], () => {
  console.log('           >>>>>>>>  Starting watching development folder...');

  return gulp.watch([
    pathSrcRoot+'/**/*'   // 监视这个文件夹
  ], [
    'build-entire-app'  // 一旦有文件改动，执行这个任务
  ])
    .on('change', (/*event, done*/) => {
      console.log('\n');
      console.log('-----------------------------------------------------------');
      console.log(new Date().toLocaleString());
      console.log('Wulechuan is telling you that some files were just changed.');
      console.log('-----------------------------------------------------------');
    })
  ;
});



// 下面这个任务就是 “default” 任务。
// 当我们从命令行窗口输入gulp并回车时，gulp会自动从 default 任务开始执行。
gulp.task('default', [
  'build-entire-app',
  'watch-dev-folder'
], (onThisTaskDone) => {
  onThisTaskDone();
});

gulp.task('del', () => {
  try {
    fileSystem.unlinkSync(pathNewDistCacheRoot);
    fileSystem.unlinkSync(pathTempRoot);
    fileSystem.unlinkSync(pathDistRoot);
  } catch (e) {
    console.log('           >>>>>>>> unlinkSync failed >>>>>>>> using del...');
    del([
      pathNewDistCacheRoot,
      pathTempRoot,
      pathDistRoot
    ]);
  }
}); // For cli usage
