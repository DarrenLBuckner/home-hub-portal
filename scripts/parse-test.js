const fs = require('fs');
const path = process.argv[2];
const target = process.argv[3];
const wrap = JSON.parse(fs.readFileSync(path, 'utf8'));
const json = JSON.parse(wrap.text);
const props = json.properties || [];
console.log('total=' + json.total);
console.log('limit=' + json.limit);
console.log('offset=' + json.offset);
console.log('returned=' + props.length);
console.log('statuses=' + JSON.stringify([...new Set(props.map(p => p.status))]));
console.log('listing_types=' + JSON.stringify([...new Set(props.map(p => p.listing_type))]));
console.log('first_id=' + (props[0] ? props[0].id : 'NONE'));
console.log('first_created_at=' + (props[0] ? props[0].created_at : 'NONE'));
console.log('last_id=' + (props.length ? props[props.length - 1].id : 'NONE'));
console.log('last_created_at=' + (props.length ? props[props.length - 1].created_at : 'NONE'));
if (target) {
  const found = props.find(p => p.id === target);
  console.log('target_id=' + target);
  console.log('target_visible=' + !!found);
  if (found) {
    console.log('target_title="' + found.title + '"');
    console.log('target_status=' + found.status);
    console.log('target_user_id=' + found.user_id);
    console.log('target_created_at=' + found.created_at);
    console.log('target_position_in_page=' + (props.indexOf(found) + 1));
  }
}
