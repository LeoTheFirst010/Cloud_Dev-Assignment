const API_URL = "https://lcherull-cloudcourse-api-hnexfadcayercbc6.northcentralus-01.azurewebsites.net";

const loadButton = document.getElementById("loadCourses");
const courseList = document.getElementById("courseList");

// Load/reload course data from the server
loadButton.addEventListener("click", async () => {
    courseList.innerHTML = "<p>Loading...</p>";

    try {
        const response = await fetch(`${API_URL}/api/courses`);
        const courses = await response.json();

        courseList.innerHTML = "";

        courses.forEach(course => {
            courseList.innerHTML += `
                <div class="course">
                    <strong>${course.code}</strong><br>
                    ${course.name}<br>
                    ${course.credits} Credit Hours
                </div>
            `;
        });

    } catch (error) {
        courseList.innerHTML = "<p>Unable to load courses.</p>";
        console.error(error);
    }
});


// Search form
const searchForm = document.getElementById("searchForm");
const searchResult = document.getElementById("searchResult");

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const courseCode = document.getElementById("courseCode").value;

    searchResult.innerHTML = "<p>Searching...</p>";

    try {
        const response = await fetch(`${API_URL}/api/search`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                courseCode: courseCode
            })
        });

        const result = await response.json();

        if (result.found) {
            searchResult.innerHTML = `
                <div class="course">
                    <strong>Course Found</strong>
                    <p>${result.code}</p>
                    <p>${result.name}</p>
                    <p>${result.credits} Credit Hours</p>
                </div>
            `;
        } else {
            searchResult.innerHTML = `<p>${result.message}</p>`;
        }

    } catch (error) {
        searchResult.innerHTML = "<p>Error contacting server.</p>";
        console.error(error);
    }
});