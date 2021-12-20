import React, { useEffect, useRef } from 'react';
import {
  Form,
  Row,
  Col,
} from 'react-bootstrap';
import { withYMaps } from 'react-yandex-maps';
import 'regenerator-runtime/runtime.js'; // установил, когда добавил async в handleSubmit, иначе появлялась ошибка, что import 'regenerator-runtime' не установлен
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash';
import * as yup from 'yup';

import { addPoint } from '../map/mapSlice.js';

import {
  send,
  setFailedState,
  setSuccessfulState,
  setInvalidlState,
} from './pointsFormSlice.js';

// const coordMock = {
//   'Россия, Москва ': [55.75, 37.57],
//   'Россия, Ростов-на-Дону ': [47.222078, 39.720358],
//   'Россия, Самара ': [53.195878, 50.100202],
//   'Россия, Волгоград ': [48.707067, 44.516975],
// };

const validate = (address) => {
  const schema = yup
    .string()
    .trim()
    .required();
  return schema.validate(address);
};

const SendForm = ({ ymaps }) => {
  const inputRef = useRef();
  const dispatch = useDispatch();
  const pointsForm = useSelector((state) => state.pointsForm);
  console.log(pointsForm);

  const requestCoordinates = (addressForSearch, form) => {
    ymaps.geocode(addressForSearch)
      .then(
        (response) => {
          inputRef.current.focus();
          const obj = response.geoObjects.get(0);
          if (!obj) {
            console.log('no search results');
            dispatch(setFailedState('no search results'));
            return;
          }
          const coordinates = obj.geometry.getCoordinates();
          const address = obj.getAddressLine();
          const newPoint = { id: _.uniqueId(), coordinates, address };
          dispatch(addPoint(newPoint));
          dispatch(setSuccessfulState());
          form.reset();
        },
        (error) => {
          console.error(error);
        },
      );
  };

  useEffect(() => {
    inputRef.current.focus();

    const suggest = new ymaps.SuggestView(inputRef.current);

    suggest.events.add('select', async () => {
      // const item = e.get('item');
      inputRef.current.focus();
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(send());
    const formData = new FormData(event.target);
    const newAddress = formData.get('address');
    validate(newAddress)
      .then((validAddress) => {
        requestCoordinates(validAddress, event.target);
      })
      .catch((err) => {
        dispatch(setInvalidlState());
        console.error(err);
      });
  };

  return (
    <div className="mt-auto px-5 py-3">
      <Form onSubmit={handleSubmit}>
        <Row>
          <Form.Group as={Col} sm className="position-relative">
            <Form.Control
              type="text"
              name="address"
              data-testid="new-message"
              placeholder="Введите новую точку"
              ref={inputRef}
              readOnly={pointsForm.sendingState === 'loading'}
              isInvalid={pointsForm.sendingState === 'failed'}
            />
            <Form.Control.Feedback type="invalid" tooltip>
              {pointsForm.invalid
                ? 'requered'
                : 'address was not found'}
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
      </Form>
    </div>
  );
};

export default withYMaps(SendForm, true, []);