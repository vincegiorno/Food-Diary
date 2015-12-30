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
  .pipe(aux.concat('main.css'))
  .pipe(aux.uncss({
      html: ['index.html']
  }))
	.pipe(aux.minifyCss())
	.pipe(gulp.dest('./dist/css/'));
});

gulp.task('html', function() {
	return gulp.src(['src/*.html'], {base: 'src'})
	.pipe(aux.minifyHtml())
	.pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function() {
  gulp.watch('src/js/**/*.js', ['js']);
  gulp.watch(['src/images/*.jpg', 'src/images/*.jpeg', 'src/images/*.png',
		'src/images/*.gif'], 'img');
  gulp.watch('src/css/style.css', 'css');
  gulp.watch('src/*.html', 'html');
});

gulp.task('default', ['js', 'img', 'css', 'html', 'watch']);
