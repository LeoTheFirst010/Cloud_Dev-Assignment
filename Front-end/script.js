const API_URL = "https://cloud-dev-assignment.onrender.com";

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


// Form to add new course
const addCourseForm = document.getElementById("addCourseForm");
const addCourseResult = document.getElementById("addCourseResult");

addCourseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code = document.getElementById("newCourseCode")
        .value.trim().toUpperCase();

    const name = document.getElementById("newCourseName")
        .value.trim();

    const credits = Number(
        document.getElementById("newCourseCredits").value
    );

    // Client-side validation
    const codePattern = /^[A-Z]{2,10}\s+[0-9]{3,5}$/;

    if (
        !codePattern.test(code) ||
        name.length < 2 ||
        name.length > 100 ||
        !Number.isInteger(credits) ||
        credits < 1 ||
        credits > 6
    ) {
        addCourseResult.textContent =
            "Please enter valid course information.";
        return;
    }

    addCourseResult.textContent = "Adding course...";

    try {
        const response = await fetch(`${API_URL}/api/courses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code: code,
                name: name,
                credits: credits
            })
        });

        const result = await response.json();

        addCourseResult.textContent =
            result.message || result.error || "Request completed.";

        if (response.ok) {
            addCourseForm.reset();

            // Refresh the course list using the existing button
            document.getElementById("loadCourses").click();
        }

    } catch (error) {
        addCourseResult.textContent =
            "Unable to contact the server.";
        console.error("Add course error:", error);
    }
});
