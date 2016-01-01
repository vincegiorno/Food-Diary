var gulp = require('gulp'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    aux = gulpLoadPlugins();

gulp.task('js', function() {
    return gulp.src(['src/js/**/*.js'], {base: 'src'})
    .pipe(aux.uglify())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('img', function() {
	return gulp.src(['src/images/*.jpg', 'src/images/*.jpeg', 'src/images/*.png',
		'src/images/*.gif'], {base: 'src'})
	.pipe(aux.imagemin())
	.pipe(gulp.dest('./dist/'));
});

gulp.task('css', function() {
	return gulp.src(['src/css/bootstrap.css', 'src/css/bootstrap-theme.css', 'src/css/style.css'])
  .pipe(aux.concat('styles.css'))
  .pipe(aux.uncss({
      html: ['src/index.html']
  }))
	.pipe(aux.cssnano())
	.pipe(gulp.dest('./dist/css/'));
});

gulp.task('html', function() {
	return gulp.src(['src/*.html'], {base: 'src'})
	.pipe(aux.htmlmin({collapseWhitespace: true}))
	.pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['js', 'img', 'css', 'html']);
