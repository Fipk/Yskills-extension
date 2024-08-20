// section: API

function closePopup() {
  window.close();
}

function searchList(inputElement, ulElement) {
  inputElement.addEventListener('input', function() {
      const filter = inputElement.value.toLowerCase();
      const liElements = ulElement.getElementsByTagName('li');

      Array.from(liElements).forEach(function(li) {
          const text = li.textContent || li.innerText;
          if (text.toLowerCase().indexOf(filter) > -1) {
              li.style.display = "";
          } else {
              li.style.display = "none";
          }
      });
  });
}

function search() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  ul = document.getElementById("myUL");
  li = ul.getElementsByTagName("li");
  for (i = 0; i < li.length; i++) {
      a = li[i].getElementsByTagName("a")[0];
      txtValue = a.textContent || a.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1 || li[i].className.indexOf("alwaysshow") > -1) {
          li[i].style.display = "";
      } else {
          li[i].style.display = "none";
      }
  }
}


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
  const goHomeNav = document.querySelectorAll('#go-home');
  const goAdminNav = document.querySelectorAll('#go-admin');
  const usernames = document.querySelectorAll('#username');
  const registeredCoursesInput = document.getElementById('registered-course-input');
  const availableCoursesInput = document.getElementById('available-course-input');
  const enrolledCoursesList = document.getElementById('enrolled-courses-list');
  const coursesList = document.getElementById('courses-list');
  
  searchList(registeredCoursesInput, enrolledCoursesList);
  searchList(availableCoursesInput, coursesList);

  function respondToVisibility(element, callback) {
    var options = {
      root: document.documentElement,
    };
  
    var observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        callback(entry.intersectionRatio > 0);
      });
    }, options);
  
    observer.observe(element);
  }

  usernames.forEach(element => {
    respondToVisibility(element, async () => {
      const ret = await getJwtToken();
      const name = await getUserName(ret.jwtToken);
      if (name.error) {
        showMenu('unexpected-error');
      } else {
        element.textContent = name.data.lastName + ' ' + name.data.firstName;
      }
    }
    );
  });

  goHomeNav.forEach(button => {
    button.addEventListener('click', () => {
      showMenu('home');
      showCourses();
    });
  }
  );
  goAdminNav.forEach(button => {
    button.addEventListener('click', () => {
      showMenu('admin');
    });
  }
  );

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

  const showModal = (id, acceptFunction, cancelFunction, acceptText, cancelText) => {
    hideAllMenus();
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = 'block';
    }
    const div = document.createElement('div');
    const accept = () => {
      div.remove();
      modal.style.display = 'none';
      acceptFunction();
    }
    const cancel = () => {
      div.remove();
      modal.style.display = 'none';
      cancelFunction();
    }
    // create the buttons
    div.classList = "flexRow-01 justifyCenter-01 mt11-01";
    const acceptButton = document.createElement('button');
    acceptButton.textContent = acceptText || 'Accept';
    acceptButton.classList = "animate-01 inlineBlock-01 fMono-01 text-01 regular-01 fs9-01 ls1-01 uppercase-01 br1-01 pv2-01 ph3-01 white-01 baTransparent-01 bgRed-01 hoverBgRed-01 focusBgRed-01 mb2-01 mr5-01";
    acceptButton.addEventListener('click', accept);
    div.appendChild(acceptButton);
    const cancelButton = document.createElement('button');
    cancelButton.textContent = cancelText || 'Cancel';
    cancelButton.classList = "animate-01 inlineBlock-01 fMono-01 text-01 regular-01 fs9-01 ls1-01 uppercase-01 br1-01 pv2-01 ph3-01 neutralOnFill-01 baTransparent-01 bgNeutral-01 hoverBgNeutral-01 focusBgNeutral-01";
    cancelButton.addEventListener('click', cancel);
    div.appendChild(cancelButton);
    modal.appendChild(div);
  }

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
  goBackButton.addEventListener('click', () => {showMenu("home");});

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
        const url = "http://localhost:8080/campus/courses/register";
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
  const confirmUnregister = async (courseId) => {
    showModal('confirm-unregister', () => {unregisterFromCourse(courseId); showMenu('home'); showCourses(); }, () => {showMenu('home'); showCourses();}, 'Unregister', 'Cancel');
  }

  const unregisterFromCourse = async (courseId) => {
    try {
      const ret = await getJwtToken();
      if (ret.error) {
        showMenu('token-retrieval-error');
      } else {
        const url = "http://localhost:8080/campus/courses/unregister";
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

  const getUserName = async (token) => {
    try {
      const url = "http://localhost:8080/user/name";
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-token': token
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
  };

  const addSpinnerWithText = (parentElement, text) => {
    const container = document.createElement('div');
    container.classList.add('flexColumn-01');
    container.classList.add('alignCenter-01');
    const spinner = document.createElement('div');
    spinner.classList.add('spinnerBase-01');
    spinner.classList.add('spinner-01');
    const textElement = document.createElement('div');
    textElement.classList.add('mt11-01');
    textElement.textContent = text;
    container.appendChild(spinner);
    container.appendChild(textElement);
    parentElement.appendChild(container);
  }

  const displayAvailableCourses = async (token) => {
    ret = await token;
    const enroledCoursesList = document.getElementById('enrolled-courses-list');
    registeredCoursesInput.parentElement.style.display = 'none';
    enroledCoursesList.innerHTML = '';
    // loading spinner
    addSpinnerWithText(enroledCoursesList, 'Loading...');
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
          const btn = document.createElement('button');
          btn.classList = "animate-01 inlineBlock-01 fMono-01 text-01 regular-01 fs9-01 ls1-01 uppercase-01 br1-01 pv2-01 ph3-01 white-01 baTransparent-01 bgRed-01 hoverBgRed-01 focusBgRed-01 mb2-01 mr5-01"
          btn.textContent = 'Unregister';
          btn.addEventListener('click', () => {
            confirmUnregister(value.id);
          });
          li1.textContent = value.name;
          li1.appendChild(btn);
          enroledCoursesList.appendChild(li1);
        }
        registeredCoursesInput.parentElement.style.display = '';
      }
    }
  };
  const displayEnroledCourses = async (token) => {
    ret = await token;
    const coursesList = document.getElementById('courses-list');
    availableCoursesInput.parentElement.style.display = 'none';
    coursesList.innerHTML = '';
    // loading spinner
    addSpinnerWithText(coursesList, 'Loading...');
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
          btn.classList = "animate-01 inlineBlock-01 fMono-01 text-01 regular-01 fs9-01 ls1-01 uppercase-01 br1-01 pv2-01 ph3-01 neutralOnFill-01 baTransparent-01 bgNeutral-01 hoverBgNeutral-01 focusBgNeutral-01"
          btn.textContent = 'Register';
          btn.addEventListener('click', () => {
            registerToCourse(value.id);
            // refresh the courses list
            showMenu('home');
            showCourses();
          });
          li.textContent = value.name;
          li.appendChild(btn);
          coursesList.appendChild(li);
        }
        availableCoursesInput.parentElement.style.display = '';
      }
    }
  }

  const showCourses = async () => {
    try {
        displayAvailableCourses(getJwtToken());
        displayEnroledCourses(getJwtToken());
        const close = document.getElementById('close');
        close.addEventListener('click', () => {
          closePopup();
        });
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
          showMenu('loading-page');
          await getJwtToken();
          showCourses();
          showMenu('home');
      }
    }
  }
  );
}
);