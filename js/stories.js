"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  let fas ='far';
  if(currentUser){
    
  fas = (currentUser.favorites.some((fav)=>fav.storyId===story.storyId)) ? 'fas':'far';
  }
  return $(`
      <li id="${story.storyId}">
      <i class="favorite ${fas} fa-star"></i>
      <i style="
        display:none;
        color:red;
        margin:0 5px;
        "class="delete far fa-trash-alt fa-lg"></i>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
     
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  active='main';
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}
//put favorites on page when favorites link is clicked

function putFavoritesOnPage(){
  active='favorite';
  $allStoriesList.empty();
  hidePageComponents();
  $allStoriesList.show()
  let stories = currentUser.favorites;
  console.log(stories);
  if(stories.length===0)$allStoriesList.text('No favorites added!')

  else{
    for (let story of stories){
      const $story = generateStoryMarkup(new Story(story));
      $allStoriesList.append($story);
    }
    $allStoriesList.show();
  }

}
  
$('#favorites').on('click',putFavoritesOnPage)
  
function putOwnStoriesOnPage(){
  active='own';
  $allStoriesList.empty();
  hidePageComponents();
  $allStoriesList.show()
  let stories = currentUser.ownStories;
  console.log(stories);
  if(stories.length===0)$allStoriesList.text('No stories!')

  else{
    for (let story of stories){
      const $story = generateStoryMarkup(new Story(story));
      $allStoriesList.append($story);
    }
    $allStoriesList.show();
  }
  $('.delete').css('display','inline');
}
$('#own').on('click',putOwnStoriesOnPage);
// handle the article form being submitted

async function postHandler(e){
  e.preventDefault();
  $allStoriesList.show()
  let url = $('#url-input').val();
  let author = $('#author-input').val();
  let title = $('#title-input').val();
  
  hidePageComponents();
  $postForm.trigger('reset')
  await storyList.addStory(currentUser, {author, url, title});
  putStoriesOnPage();


}
$postForm.on('submit', postHandler);

//handle favorite star click - fas is full star and far is outline
function handleFavoriteClick(e){
  let $i= $(e.target)
  let id= $i.parent().attr('id');
  let story= storyList.stories.filter((story)=>story.storyId===id)[0];
  
  console.log(story);
  ($i.hasClass("far")) ? currentUser.addRemoveFavorite(true, story):currentUser.addRemoveFavorite(false, story);

  $($i).toggleClass('far');
  $($i).toggleClass('fas')

}
$('#all-stories-list').on('click','.favorite',handleFavoriteClick);


//handles the click of a delete button and removes element from DOM, and deletes the story from the database
async function deleteStory(evt){
  let $btn = $(evt.target)
  let id = $btn.parent().attr('id');
  console.log({$btn,id})
  let response = await axios({
    method:'delete',
    url: `${BASE_URL}/stories/${id}`,
    data:{
    token:currentUser.loginToken
    }
  })
  $btn.parent().remove();
  storyList.stories = storyList.stories.filter((story)=> story.storyId !==id);
  console.log(response);
}

$('#all-stories-list').on('click', '.delete',deleteStory)
//check for scroll and reload more content

$(window).scroll(function() {
  if($(window).scrollTop() + $(window).height() == $(document).height()) {
    (active==='main')? loadMoreStories(): null;
  }
});

async function loadMoreStories(){
  let skip = $allStoriesList.children().length;
  let newStoryList = await StoryList.getStories(skip)
  storyList.stories+=newStoryList.stories;
  putStoriesOnPage();

}