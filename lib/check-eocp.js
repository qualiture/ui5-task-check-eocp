const semver = require('semver');

module.exports = async ({ log, taskUtil, options }) => {

    /**
     * Checks the UI5 version as specified in the YAML file
     */
    function checkVersion() {
        const currentVersion = taskUtil.getProject().getFrameworkVersion();
        const failOnEocp = !!options?.configuration?.failOnEocp;

        if (currentVersion) {
            fetch('https://ui5.sap.com/versionoverview.json')
                .then((response) => response.json())
                .then((result) => {
                    const patch = findMatchingPatch(currentVersion, result.patches)
        
                    if (patch) {
                        if (isBeforeQuarter(patch.eocp)) {    
                            log.info(`👍 End of Cloud Provisioning of your UI5 version '${currentVersion}' not yet reached (${patch.eocp})'`);
                        } else {
                            log.error(`\u001b[41m\u001b[1m⚠️  WARNING! UI5 version '${patch.version}' has reached End of Cloud Provisioning (${patch.eocp})!\u001b[0m`);
                            log.error(`\u001b[41m\u001b[1m             Visit \u001b[41m\u001b[3mhttps://ui5.sap.com/versionoverview.html\u001b[0m\u001b[41m\u001b[1m for applicable versions\u001b[0m`);

                            if (failOnEocp) {
                                Promise.reject(new Error(`UI5 version '${patch.version}' has reached End of Cloud Provisioning (${patch.eocp})!`));
                            }
                        }
                    }
                })
                .catch((err) => {
                    log.error('\u001b[33m\u001b[1mError fetching UI5 version overview. Task ui5-task-check-eocp will be skipped.\u001b[0m');
                });
        } else {
            log.warn("\u001b[33m\u001b[1mNo UI5 version specified in ui5.yaml file! Cannot determine End of Cloud Provisioning date!\u001b[0m")
        }
    }
    
    /**
     * Failsave semver satisfier
     * 
     * @param {*} a 
     * @param {*} b 
     * @returns 
     */
    function checkSemver(a, b) {
        try {
            return semver.satisfies(a, b);
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Returns the matching patch (version and End of Cloud Provisioning date) with the provided `patches` for the provided `checkVersion`
     * 
     * @param {*} checkVersion 
     * @param {*} patches 
     * @returns 
     */
    function findMatchingPatch(checkVersion, patches) {
        const patch = patches.find((item) => checkSemver(checkVersion, item.version));
    
        if (!patch) {
            const versionRanges = patches.filter(item => item.version !== '*').map(item => item.version);
            const closest = findClosestSemverMatch(checkVersion, versionRanges);
    
            log.warn(`\u001b[33m\u001b[1mYour UI5 version '${checkVersion}' does not exist! The closest available match to your version would be '${closest}' (see: https://ui5.sap.com/versionoverview.html)\u001b[0m`);
        } else if (!patch.eocp) {
            log.error("\u001b[33m\u001b[1mNo matching patch found!\u001b[0m");
        }
    
        return patch;
    }
    
    /**
     * Finds the closest semver version within the provided `patches` for the `semverString` provided
     * 
     * @param {*} semverString 
     * @param {*} patches 
     * @returns 
     */
    function findClosestSemverMatch(semverString, patches) {
        const versionRanges = patches.filter(version => version !== '*');
    
        if (!versionRanges.length) {
            return null;
        }
    
        const sortedSemvers = semver.sort(versionRanges, true);
    
        const offsets = sortedSemvers.map((semverA) => {
            const parsedSemverA = semver.parse(semverA);
            const parsedSemverB = semver.parse(semverString);
    
            return Math.abs(parsedSemverA.major * 1e8 + parsedSemverA.minor * 1e4 + parsedSemverA.patch - (parsedSemverB.major * 1e8 + parsedSemverB.minor * 1e4 + parsedSemverB.patch));
        });
    
        const minOffset = Math.min.apply(null, offsets);
    
        return sortedSemvers[offsets.indexOf(minOffset)];
    }
    
    function isBeforeQuarter(quarterString) {
        if (quarterString.startsWith('Q')) {
            const [quarter, year] = quarterString.split('/');
            const quarterStartMonths = {
                Q1: 0, // Jan
                Q2: 3, // Apr
                Q3: 6, // Jul
                Q4: 9  // Oct
            };
        
            const quarterStartMonth = quarterStartMonths[quarter];
            const specifiedDate = new Date(parseInt(year), quarterStartMonth, 0); // Last day of the quarter
        
            const currentDate = new Date();
    
            return currentDate < specifiedDate;
        } else {
            // log.warn(`End of Cloud Provisioning date is not specified: '${quarterString}'`);
            return true;
        }
    }

    checkVersion();
};
