const gulp = require('gulp')
const ts = require('gulp-typescript')
const tsProject = ts.createProject('tsconfig.json')

gulp.task('ts-compile', () => {
    const result = tsProject.src()
        .pipe(tsProject())

    return Promise.all([result.js.pipe(gulp.dest('lib')), result.dts.pipe(gulp.dest('lib'))])
})

gulp.task('proto', () => {
    return gulp.src(['src/proto/**/*.js']).pipe(gulp.dest('lib/proto'))
})

gulp.task('default', gulp.parallel(['proto', 'ts-compile']))