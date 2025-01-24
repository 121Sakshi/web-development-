const form = document.getElementById('form');
const fullname = document.getElementById('fullname');
const email = document.getElementById('email');
const password = document.getElementById('password');
const birthdate = document.getElementById('birthdate');
const gender = document.getElementById('gender');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  validateInputs();
});

function validateInputs() {
  checkRequired([fullname, email, password, birthdate, gender]);
  checkEmail(email);
  checkLength(password, 6, 20);
}

function checkRequired(inputs) {
  inputs.forEach((input) => {
    const formControl = input.parentElement;
    if (input.value.trim() === '') {
      setError(formControl, `${getFieldName(input)} is required`);
    } else {
      setSuccess(formControl);
    }
  });
}

function checkEmail(input) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!re.test(input.value.trim())) {
    setError(input.parentElement, 'Email is not valid');
  } else {
    setSuccess(input.parentElement);
  }
}

function checkLength(input, min, max) {
  if (input.value.length < min) {
    setError(input.parentElement, `Password must be at least ${min} characters`);
  } else if (input.value.length > max) {
    setError(input.parentElement, `Password must be less than ${max} characters`);
  } else {
    setSuccess(input.parentElement);
  }
}

function setError(formControl, message) {
  formControl.className = 'form-control error';
  formControl.querySelector('small').innerText = message;
}

function setSuccess(formControl) {
  formControl.className = 'form-control success';
}

function getFieldName(input) {
  return input.id.charAt(0).toUpperCase() + input.id.slice(1);
}
