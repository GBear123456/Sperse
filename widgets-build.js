const fs = require('fs-extra');
const concat = require('concat');

(async function build() {
    const files = [
        './dist/package-chooser-widget/runtime.js',
        './dist/package-chooser-widget/polyfills.js',
        './dist/package-chooser-widget/scripts.js',
        './dist/package-chooser-widget/main.js',
        './dist/package-chooser-widget/vendor.js',
        './dist/package-chooser-widget/styles.js',
    ];
    await fs.ensureDir('./dist/assets/widgets');
    await concat(files, './dist/assets/widgets/package-chooser-widget.js');
    console.log('Widgets created successfully');
})()
