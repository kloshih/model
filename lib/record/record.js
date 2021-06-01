
import Type, { initialize } from '../model/type';
import log from 'logsync';

/**
 * 
 * @since  1.0
 * @author Lo Shih <kloshih@gmail.com>
 * @copyright Copyright 2021 Lo Shih 
 */
class Record {

  static get props() {
    return {
    }
  }

  constructor(config, owner) {
    Type.initialize(this, config, owner);
    initialize(this, config, owner);
    this.owner = owner;
  }
  
  
}
export default Record;