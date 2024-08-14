// section: API

async function extractUserId(jwtToken) {
  const url = "http://localhost:8080/user/extractId";
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-token': jwtToken
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return { error: null, data: data };
  } catch (error) {
    return { error: error.message, data: null };
  }
}

async function fetchAvailableCourses(jwtToken) {
  const url = "http://localhost:8080/user/availableCourses";

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-token': jwtToken
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { error: null, data: data };
  } catch (error) {
    return { error: error.message, data: null };
  }
}

async function fetchEnroledCourses(jwtToken) {
  const url = "http://localhost:8080/user/courses";

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-token': jwtToken
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { error: null, data: data };
  } catch (error) {
    return { error: error.message, data: null };
  }
}

// endsection: API

document.addEventListener('DOMContentLoaded', async () => {
  const tokenDiv = document.getElementById('token');
  const showTokenButton = document.getElementById('show-token');
  const copyTokenButton = document.getElementById('copy-token');
  const goBackButton = document.getElementById('go-back');
  const goToYskillsButtons = document.querySelectorAll('#go-to-yskills');

  const getJwtToken = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        // check if the user is on https://ytrack.learn.ynov.com/
        // if not, reject
        const url = "https://ytrack.learn.ynov.com/";
        if(!url.includes ("https://ytrack.learn.ynov.com/")) {
          throw "You are not on the right page";
        }
        const key = "hasura-jwt-token";
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        const fromPageLocalStore = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: function() {
                return [localStorage.getItem('hasura-jwt-token')];
            }
        } );
        if (fromPageLocalStore[0].result === null || fromPageLocalStore[0].result === undefined) {
          throw "Token not found";
        }
        if (fromPageLocalStore[0].result === "") {
          throw "Token is empty";
        }
        resolve({jwtToken: fromPageLocalStore[0].result});
      }
      
      catch(err) {
        reject({error: err});
      }
    });
  }

  // Function to hide all elements with the class "menu"
  const hideAllMenus = () => {
    const menus = document.querySelectorAll('.menu');
    menus.forEach(menu => {
      menu.style.display = 'none';
    });
  };

  // Function to show a specific menu by ID
  const showMenu = (id) => {
    hideAllMenus();
    const menu = document.getElementById(id);
    if (menu) {
      menu.style.display = 'block';
    }
  };

  // Function to show the token
  const showToken = async () => {
    try {
      let ret = await getJwtToken();
      if (ret.error) {
        showMenu('token-retrieval-error');
      } else {
        tokenDiv.textContent = ret.jwtToken;
        tokenDiv.style.display = 'block';
        showTokenButton.textContent = 'Hide token';
      }
    } catch (err) {
      showMenu('token-retrieval-error');
    }
  };

  // Function to hide the token
  const hideToken = () => {
    tokenDiv.style.display = 'none';
    showTokenButton.textContent = 'Show token';
  };

  // Add event listeners for the buttons
  showTokenButton.addEventListener('click', () => {
    if (showTokenButton.textContent === 'Show token') {
      showToken();
    } else {
      hideToken();
    }
  });

  // Function to copy the token to clipboard
  const copyToken = async () => {
    try {
      let ret = await getJwtToken();
      if (ret.error) {
        showMenu('token-retrieval-error');
      } else {
        navigator.clipboard.writeText(ret.jwtToken);
        alert('Token copied to clipboard');
      }
    } catch (err) {
      showMenu('token-retrieval-error');
    }
  };

  copyTokenButton.addEventListener('click', copyToken);
  goBackButton.addEventListener('click', showMenu("good-page"));

  // Add event listeners to go to Yskills buttons
  goToYskillsButtons.forEach(button => {
    button.addEventListener('click', () => {
      chrome.tabs.create({ url: "https://ytrack.learn.ynov.com/intra/yskills" });
    });
  });

  const registerToCourse = async (courseId) => {
    try {
      const ret = await getJwtToken();
      if (ret.error) {
        showMenu('token-retrieval-error');
      } else {
        const url = "http://localhost:8080/campus/register";
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-token': ret.jwtToken
          },
          body: JSON.stringify({ courseId: courseId })
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(data);
        if (data.error) {
          throw new Error(data.error);
        }
      }
    } catch (err) {
      console.error(err);
      showMenu('unexpected-error');
    }
  };

  const showCourses = async () => {
    try {
      let ret = await getJwtToken();
      if (ret.error) {
        showMenu('token-retrieval-error');
      } else {
        const enroledCoursesList = document.getElementById('enrolled-courses-list');
        console.log(enroledCoursesList);
        enroledCoursesList.innerHTML = '';
        // add a loading message
        const li1 = document.createElement('li');
        li1.textContent = 'Loading...';
        enroledCoursesList.appendChild(li1);
        const enroledCourses = await fetchEnroledCourses(ret.jwtToken);
        enroledCoursesList.innerHTML = '';
        if (enroledCourses.error) {
          showMenu('unexpected-error');
        } else {
          if (enroledCourses.data === null || enroledCourses.data === undefined || enroledCourses.data.length === 0) {
            const li1 = document.createElement('li');
            li1.textContent = 'You are not enroled in any course';
            enroledCoursesList.appendChild(li1);
          } else {
            for (const [key, value] of Object.entries(enroledCourses.data)) {
              const li1 = document.createElement('li');
              li1.textContent = value.name;
              enroledCoursesList.appendChild(li1);
            }
          }
        }
  
        const coursesList = document.getElementById('courses-list');
        coursesList.innerHTML = '';
        // add a loading message
        const li = document.createElement('li');
        li.textContent = 'Loading...';
        coursesList.appendChild(li);
        const courses = await fetchAvailableCourses(ret.jwtToken);
        coursesList.innerHTML = '';
        if (courses.error) {
          showMenu('unexpected-error');
        } else {
          if (courses.data === null || courses.data === undefined || courses.data.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No courses available';
            coursesList.appendChild(li);
          } else {
            for (const [key, value] of Object.entries(courses.data)) {
              const li = document.createElement('li');
              const btn = document.createElement('button');
              btn.classList = "animate-01 inlineBlock-01 fMono-01 text-01 regular-01 fs9-01 ls1-01 uppercase-01 br1-01 pv2-01 ph3-01 neutralOnFill-01 baTransparent-01 bgNeutral-01 hoverBgNeutral-01 focusBgNeutral-01 ma2-01"
              btn.textContent = 'Register';
              btn.addEventListener('click', () => {
                registerToCourse(value.id);
                // refresh the courses list
                showCourses();
              });
              li.textContent = value.name;
              li.appendChild(btn);
              coursesList.appendChild(li);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      showMenu('unexpected-error');
    }
  }

  // Check if the website is https://ytrack.learn.ynov.com/
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];
    const tabUrl = activeTab.url;

    if (!tabUrl.includes("https://ytrack.learn.ynov.com/")) {
      showMenu('wrong-page');
    } else {
      // Optionally, you could add more logic to check if the user is on the right campus
      const campusPath = "/intra/yskills";
      if (!tabUrl.includes(campusPath)) {
        showMenu('wrong-campus');
      } else {
        // add the courses to the ul with id "courses-list"
        let ret = await getJwtToken();
        const coursesList = document.getElementById('courses-list');
        const courses = await fetchAvailableCourses(ret.jwtToken);
        if (courses.error) {
          showMenu('unexpected-error');
        } else {
          showCourses();
          showMenu('good-page');
        }
      }
    }
  });
});