(function(){
    window.addEventListener('load', ()=>{
        window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
        openDB();
    });
    
    let db;
    let forms;
    
    function openDB() {
        //Initialazing empty array to store forms
        forms = [];
        //Opening database
        let request = indexedDB.open("formsDatabase", "1");

        request.onsuccess = () => {
            db = request.result;
            let formsFromDB = getFormsFromDB();

            formsFromDB.onsuccess = ()=>{
                createForms(formsFromDB.result);
            }
        }
        request.onupgradeneeded = (e)=>{
            db = e.target.result;
            let objectStore = db.createObjectStore("forms", {autoIncrement: true});
            
            objectStore.transaction.oncomplete = () => {
                let formsObjectStore = db.transaction("forms", "readwrite").objectStore("forms");
                formsObjectStore.add(forms);
            }
        }
    }
    
    let addInputBtn = document.querySelector(".btn-add");
    addInputBtn.addEventListener("click", addInput);

    //This function returns forms array from database to allow its modification
    function getFormsFromDB() {
        let transaction = db.transaction("forms", "readwrite");
        let objectStore = transaction.objectStore("forms");
            
        return objectStore.get(1);
    }

    //This function removes previous array from database and saves modified forms array to its object store in database
    function saveFormsToDB(forms) {
        let transaction = db.transaction("forms", "readwrite");
        let objectStore = transaction.objectStore("forms");
        let formsFromDB = objectStore.delete(1);

        formsFromDB.onsuccess = () => {
            objectStore.put(forms, 1);
        }
    }

    //This function adds first level form
    function addInput(e) {
        e.preventDefault();
        let formsFromDB = getFormsFromDB();

        formsFromDB.onsuccess = () => {
            let form = {
                id: document.querySelector(".forms").childNodes.length.toString(),
                question: "",
                type: "",
                children: []         //Children is an array of each subform
            };

            let forms = formsFromDB.result;
            forms.push(form);

            createForms(forms);
            saveFormsToDB(forms);
        }
    }

    //This function allows to add sub-input to forms array
    function addSubInput(e) {
        e.preventDefault();
        let parentForm = e.currentTarget.parentNode.parentNode;
        let parentFormId = parentForm.id.toString();
        
        let newSubForm = {
            //Unique id is created for subform object
            id: `${parentFormId}.${parentForm.parentNode.childNodes.length-1}`.toString(),
            question: "",
            type: "",
            parentType: parentForm.querySelector(".select-type").value,
            condition: "",
            condition_value: "",
            children: []
        }
        
        let formsFromDB = getFormsFromDB();

        formsFromDB.onsuccess = () => {
            let forms = formsFromDB.result;
            let parent = findParentObject(forms, parentFormId); 
    
            parent.children.push(newSubForm);
            createForms(forms);
            saveFormsToDB(forms);
        }   
    }

    //This function is finding parent form of subform in forms array
    function findParentObject(arr, id) {
        if( arr.id === id ) {
            return arr;
        }

        let result, elem; 

        for (elem in arr) {
            if( arr.hasOwnProperty(elem) && typeof arr[elem] === 'object' ) {
                result = findParentObject(arr[elem], id);
                if(result) {
                    return result;
                }
            }
        }
        return result;
    }

    //This function is saving inputs to forms array so they don't change to blank
    function changeForms(e){
        e.preventDefault();
        let parentForm = e.target.parentNode;
        let parentFormId = parentForm.id.toString();
        let formsFromDB = getFormsFromDB();

        formsFromDB.onsuccess = () => {

            let forms = formsFromDB.result;
            let objToChange = findParentObject(forms, parentFormId);
            
            let questionValue = e.target.parentNode.querySelector(".question").value;
            let selectValue = e.target.parentNode.querySelector(".select-type").value;
            
            if(objToChange.id.length > 1){
                let conditionValue = e.target.parentNode.querySelector(".condition-value").value;
                objToChange.condition_value = conditionValue;

                if(objToChange.parentType == "number"){
                    let conditionValueSelect = e.target.parentNode.querySelector(".condition-value-select").value;
                    objToChange.condition = conditionValueSelect;
                }
            }
                objToChange.question = questionValue;
                objToChange.type = selectValue;            
            
            createForms(forms);
            saveFormsToDB(forms);
        }

    }

    //This function is deleting form from forms array, after clicking delete button
    function deleteForm(e) {
        e.preventDefault();
        let parentForm = e.currentTarget.parentNode.parentNode;
        let parentFormId = parentForm.id.toString();
        let formsFromDB = getFormsFromDB();

        formsFromDB.onsuccess = () => {
            let forms = formsFromDB.result;

            if(parentFormId.length == 1) {
                let index;
    
                forms.forEach((elem)=>{
                if(elem["id"] == parentFormId){
                    index = forms.indexOf(elem);
                }});
    
                forms.splice(index, 1);
            } else {
                let parentFormIdSubstring = parentFormId.substring(0, parentFormId.length-2);
                let child = findParentObject(forms, parentFormId);
    
                child.remove = true;
    
                let parent = findParentObject(forms, parentFormIdSubstring);
                let index;
                
                parent.children.forEach((elem)=>{
                    if(elem["remove"] == true){
                        index = parent.children.indexOf(elem);
                    }
                });

                parent.children.splice(index, 1);
            }

            createForms(forms);
            saveFormsToDB(forms);
        }


    }

    //This function renders forms array to the DOM
    function createForms(arr, li = undefined) {
        let formsContainer = document.querySelector(".forms");

        if(arr.length > 0){

            if(arr[0].id.length == 1){
                formsContainer.innerHTML = "";
            }

            arr.forEach((elem)=>{
            //Each form elements
            let form = document.createElement("form");
            let textInput = document.createElement("input");
            let selectInput = document.createElement("select");
            let optionNumber = document.createElement("option");
            let optionText = document.createElement("option");
            let optionYesNo = document.createElement("option");
            let btnDiv = document.createElement("div");
            let btnAddSub = document.createElement("button");
            let btnDelete = document.createElement("button");
            let listElement = document.createElement("li");
            let formUL = elem.hasOwnProperty("parentType") ? document.createElement("ul") : undefined;
            let optionNumberText = document.createTextNode("Number");
            let optionTextText = document.createTextNode("Text");
            let optionYesNoText = document.createTextNode("Yes/No");
            let fontAwesomePlus = document.createElement("i");
            let fontAwesomeDelete = document.createElement("i");

            //QuestionLabel
            let questionLabel = document.createElement("label");
            let questionLabelText = document.createTextNode("Question");
            questionLabel.appendChild(questionLabelText);
            questionLabel.setAttribute("for", "question");

            //TypeLabel
            let typeLabel = document.createElement("label");
            let typeLabelText = document.createTextNode("Type");
            typeLabel.appendChild(typeLabelText);
            typeLabel.setAttribute("for", "type");

            //Setting attributes
            textInput.setAttribute("type", "text");
            textInput.setAttribute("value", elem.question);
            textInput.setAttribute("id", "question");
            selectInput.setAttribute("id", "type");
            optionNumber.setAttribute("value", "number");
            optionText.setAttribute("value", "text");
            optionYesNo.setAttribute("value", "yes/no");
            form.setAttribute("id", elem.id);

            //Setting selected option element basing on property of that element object
            if(optionNumber.value === elem.type){
                optionNumber.setAttribute("selected", "selected");
            } else if(optionText.value === elem.type){
                optionText.setAttribute("selected", "selected");
            } else if(optionYesNo.value === elem.type){
                optionYesNo.setAttribute("selected", "selected");
            }

            //Adding classes
            btnAddSub.classList.add("btn-add-sub");
            textInput.classList.add("question");
            selectInput.classList.add("select-type");
            form.classList.add("form-body");
            optionNumber.classList.add("o-number");
            optionText.classList.add("o-text");
            optionYesNo.classList.add("o-yesno");
            btnDiv.classList.add("btn-div");
            btnDelete.classList.add("btn-delete");
            listElement.classList.add("list-elem");
            formUL ? formUL.classList.add("form-ul") : undefined;
            fontAwesomePlus.classList = "fas fa-plus fa-btn-add";
            fontAwesomeDelete.classList = "fas fa-trash-alt fa-btn-delete";

            //Creating subforms based on its parentType property
            if(elem.hasOwnProperty("parentType") && elem.parentType == "text") {
                let conditionLabel = document.createElement("label");
                let conditionLabelText = document.createTextNode("Condition equals");
                let textInput = document.createElement("input");
                conditionLabel.setAttribute("for", "condition-value");
                textInput.setAttribute("type", "text");
                textInput.setAttribute("value", elem.condition_value);
                textInput.setAttribute("id", "condition-value");
                textInput.classList.add("condition-value");
                conditionLabel.appendChild(conditionLabelText);
                form.appendChild(conditionLabel);
                form.appendChild(textInput);
            } else if (elem.hasOwnProperty("parentType") && elem.parentType == "number"){
                let conditionValueSelect = document.createElement("select");
                let optionGreater = document.createElement("option");
                let optionLess = document.createElement("option");
                let optionEquals = document.createElement("option");
                let optionGreaterText = document.createTextNode("Greater than");
                let optionLessText = document.createTextNode("Less than");
                let optionEqualsText = document.createTextNode("Equals");
                let conditionLabel = document.createElement("label");
                let conditionLabelText = document.createTextNode("Condition ");
                let textInput = document.createElement("input");
                optionGreater.setAttribute("value", "greater than");
                optionLess.setAttribute("value", "less than");
                optionEquals.setAttribute("value", "equals");
                selectInput.setAttribute("id", "condition-value");
                conditionValueSelect.classList.add("condition-value-select");
                optionGreater.appendChild(optionGreaterText);
                optionLess.appendChild(optionLessText);
                optionEquals.appendChild(optionEqualsText);
                conditionValueSelect.appendChild(optionGreater);
                conditionValueSelect.appendChild(optionLess);
                conditionValueSelect.appendChild(optionEquals);
                
                if(optionGreater.value == elem.condition){
                    optionGreater.setAttribute("selected", "selected");
                } else if(optionLess.value == elem.condition){
                    optionLess.setAttribute("selected", "selected");
                } else if(optionEquals.value == elem.condition){
                    optionEquals.setAttribute("selected", "selected");
                } 

                conditionLabel.setAttribute("for", "condition-value");
                textInput.setAttribute("type", "text");
                textInput.setAttribute("value", elem.condition_value);
                textInput.classList.add("condition-value");
                conditionLabel.appendChild(conditionLabelText);
                form.appendChild(conditionLabel);
                form.appendChild(conditionValueSelect);
                form.appendChild(textInput);
            } else if (elem.hasOwnProperty("parentType") && elem.parentType == "yes/no"){
                let conditionLabel = document.createElement("label");
                let conditionLabelText = document.createTextNode("Condition equals");
                let selectInput = document.createElement("select");
                let optionYes = document.createElement("option");
                let optionNo = document.createElement("option");
                let optionYesText = document.createTextNode("Yes");
                let optionNoText = document.createTextNode("No");
                optionYes.setAttribute("value", "yes");
                optionNo.setAttribute("value", "no");
                conditionLabel.setAttribute("for", "condition-value");
                selectInput.setAttribute("id", "condition-value");
                if(optionYes.value == elem.condition_value){
                    optionYes.setAttribute("selected", "selected");
                } else if(optionNo.value == elem.condition_value){
                    optionNo.setAttribute("selected", "selected");
                }
                selectInput.classList.add("condition-value");
                conditionLabel.appendChild(conditionLabelText);
                optionYes.appendChild(optionYesText);
                optionNo.appendChild(optionNoText);
                selectInput.appendChild(optionYes);
                selectInput.appendChild(optionNo);
                form.appendChild(conditionLabel);
                form.appendChild(selectInput);
            }
            
            //Appending elements
            btnAddSub.appendChild(fontAwesomePlus);
            btnDelete.appendChild(fontAwesomeDelete);
            btnDiv.appendChild(btnAddSub);
            btnDiv.appendChild(btnDelete);
            form.appendChild(questionLabel);
            form.appendChild(textInput);
            optionNumber.appendChild(optionNumberText);
            optionText.appendChild(optionTextText);
            optionYesNo.appendChild(optionYesNoText);
            selectInput.appendChild(optionNumber);
            selectInput.appendChild(optionText);
            selectInput.appendChild(optionYesNo);
            form.appendChild(typeLabel);
            form.appendChild(selectInput);
            form.appendChild(btnDiv);
            listElement.appendChild(form);

            if(elem.id.length == 1){
                formsContainer.appendChild(listElement);
            } else {
                formUL.appendChild(listElement);
                li.appendChild(formUL);
            }

            btnAddSub.addEventListener("click", addSubInput);
            btnDelete.addEventListener("click", deleteForm);

            if(elem.children.length != 0){
                createForms(elem.children, listElement);
            }
        })

            let allForms = document.querySelectorAll("form");

            for(let i = 0; i < allForms.length; i++) {
                allForms[i].addEventListener("change", changeForms);
            }
        } else {
        formsContainer.innerHTML = "";
        }
    }
})();




