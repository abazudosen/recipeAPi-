import Search from './models/Search';
import { elements, renderLoader, clearLoader } from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';


/** Global state of the app
 * search obj
 * current recipe object
 * shopping list object
 * liked recipes
 * */

 const state = {

 };
 //window.state = state;

 /**
  * SEARCH CONTROLLER
  */

const ctrlSearch = async () => {
    //1. qet query from view
    const query = searchView.getInput();

    if(query) {
        //2. new search object and add to state
        state.search = new Search(query);

        //3. prepate UI fro results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            //4. search for recipes
            await state.search.getResult();

            //5. render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);   
        } catch (error) {
            //console.log(error);
            clearLoader();
        }
    }
};

 elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    ctrlSearch();
 });
 

 elements.searchResPage.addEventListener('click', e => {
     const btn =  e.target.closest('.btn-inline');
     if(btn) {
         const goToPage = parseInt(btn.dataset.goto, 10);
         searchView.clearResults();
         searchView.renderResults(state.search.result, goToPage);
     }
 });



 /**
  * RECIPE CONTROLLER
  */

const ctrlRecipe = async() => {
    //get ID from url
    const id = window.location.hash.replace('#', '');
    // console.log(id);

    if(id) { 
        //prepare ui for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //hightlight selected from search view
        if(state.search) searchView.highlightSelected(id);

        //create new recipe object
        state.recipe = new Recipe(id);
        
        try {

            //get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredient();

            //calculate servings and time
            state.recipe.calTime();
            state.recipe.calServing();

            //render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
            //console.log(state.recipe);
        
        } catch (error) {
            alert('error processig recipe!');
            //console.log(error);
        }
     }
};
    
// window.addEventListener('hashchange', ctrlRecipe);
// window.addEventListener('load', ctrlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, ctrlRecipe));



/**
*LIST CONTROLLER
*/
//testing
const controlList = () => {
    //ccreate a new list IF there is on yet
    if(!state.list) state.list = new List();

    // add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    }); 
}

//handle delete and update list item event
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')){
        //delete from state
        state.list.deleteItem(id);

        //delete from UI
        listView.deleteItem(id);

        // handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

/**
 * LIKE CONTROLLER
 */

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();

    const currentID = state.recipe.id;
    
    // user has NOT yet liked current recipe
    if(!state.likes.isLiked(currentID))  {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        //Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);
        //console.log(state.likes);

    // user HAS liked current recipe
    } else {
        // Remove like to the state
        state.likes.deleteLike(currentID);

        //Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like to UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumOfLikes());
};

window.addEventListener('load', () => {
    state.likes = new Likes();

    // restore likes
    state.likes.readStorage();

    // toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumOfLikes());

    // render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

//handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');   
            recipeView.updateServingsIngredients(state.recipe);
        }
        
    } else if(e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // add ingredient to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        //like controller
        controlLike();
    }
});