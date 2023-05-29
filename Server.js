// Module/Files imports
const express = require('express');
const swaggerUI = require('swagger-ui-express');
const swaggerDocs = require('./Swagger.json');
const dental = require("./dental-clinics.json");
const vet = require("./vet-clinics.json");

// Express server initialization
const app = express();

// Converting vet-clinics.json to dental-clinics.json base
const _vet = vet.map(item => {
    const _clinic = {
        name: item.clinicName,
        stateName: item.stateCode,
        availability: item.opening
    };
    return _clinic;
});

// Combine data from both json files
const clinics = dental.concat(_vet);

// Single Line Search endpoint ===> Currently not in use via Swagger-Ui
app.get('/clinic/:query', (req, res) => {
    try {
        const query = req.params.query.toLowerCase();

        // Filter by signle line search
        const results = clinics.filter(item => {
            for (const key in item) {
                if (item[key].toString().toLowerCase().includes(query)) { return true; }
            }
            return false;
        });

        res.json(results);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});


// Signle endpoint for data list & filteration
app.get('/clinic', (req, res) => {
    try {
        const { name, state, availability_from, availability_to } = req.query;
        let results = clinics;

        // Filter by clinic name
        if (name) {
            results = results.filter(clinic => clinic.name.toLowerCase().includes(name.toLowerCase()));
        }

        // Filter by State name or code
        if (state) {
            results = results.filter(clinic => {
                if (clinic.stateName.toLowerCase() === state.toLowerCase())
                    return true;
                else
                    clinic.stateName.toLowerCase().includes(state.toLowerCase())
            }
            );
        }

        // Filter by availability (from-to)
        if (availability_from && availability_to) {
            // Convert time strings to Date objects
            const startTime = new Date(`2000-01-01T${availability_from}`);
            const endTime = new Date(`2000-01-01T${availability_to}`);

            // Filter clinics based on time availability
            results = results.filter((clinic) => {
                const clinicStartTime = new Date(`2000-01-01T${clinic.availability.availability_from}`);
                const clinicEndTime = new Date(`2000-01-01T${clinic.availability.availability_to}`);
                return clinicStartTime >= startTime && clinicEndTime <= endTime;
            });
        }

        else if (availability_from) {
            // Filter clinics based on the "from" time
            results = results.filter((clinic) => {
                const clinicStartTime = new Date(`2000-01-01T${clinic.availability.from}`);
                const startTime = new Date(`2000-01-01T${availability_from}`);
                return clinicStartTime >= startTime;
            });
        }

        else if (availability_to) {
            // Filter clinics based on the "to" time
            results = results.filter((clinic) => {
                const clinicEndTime = new Date(`2000-01-01T${clinic.opening.to}`);
                const endTime = new Date(`2000-01-01T${availability_to}`);
                return clinicEndTime >= endTime;
            });
        }

        //Final responce return
        res.json(results);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

//Swagger-UI setup
app.use('/api', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Start the server
const port = 3000;
app.listen(port, () => { console.log(`Server running on port ${port}`); });
