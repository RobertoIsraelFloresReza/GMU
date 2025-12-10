package utez.edu.mx.tdsw.services.person;

import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.person.Persons;
import utez.edu.mx.tdsw.models.person.PersonsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class PersonService {
    private final PersonsRepository personsRepository;

    public PersonService(PersonsRepository personsRepository) {
        this.personsRepository = personsRepository;
    }

    @Transactional
    public ResponseEntity<ApiResponse> getAll(){
        return new ResponseEntity<>(new ApiResponse(
                personsRepository.findAll(), HttpStatus.OK
        ), HttpStatus.OK);
    }
    @Transactional
    public ResponseEntity<ApiResponse> getPersonById(Long id){
        Optional<Persons> encontrarPersonId = personsRepository.findById(id);
        if(encontrarPersonId.isEmpty()){
            return new ResponseEntity<>(new ApiResponse(
            ), HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(new ApiResponse(
                personsRepository.findById(id).orElse(null), HttpStatus.OK
        ), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> deletePersonById(Long id){
        personsRepository.deleteById(id);
        return new ResponseEntity<>(new ApiResponse(
        ), HttpStatus.OK);
    }


    @Transactional
    public ResponseEntity<ApiResponse> savePerson(Persons person){
        Optional<Persons> encontrarPerson = personsRepository.findByEmail(person.getEmail());
        if(encontrarPerson.isPresent()){
            return new ResponseEntity<>(new ApiResponse(
            ), HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(new ApiResponse(
                personsRepository.save(person), HttpStatus.OK
        ), HttpStatus.OK);
    }


    @Transactional
    public ResponseEntity<ApiResponse> updatePerson(Persons person){
        Optional<Persons> encontrarPerson = personsRepository.findById(person.getIdPerson());
        if(encontrarPerson.isPresent())
            return new ResponseEntity<>(new ApiResponse(
                    personsRepository.save(person), HttpStatus.OK
            ), HttpStatus.OK);
        return new ResponseEntity<>(new ApiResponse(
        ), HttpStatus.BAD_REQUEST);
    }

    @Transactional
    public ResponseEntity<ApiResponse> getPersonByEmail(String email){
        Optional<Persons> encontrarPerson = personsRepository.findByEmail(email);
        if(encontrarPerson.isEmpty()){
            return new ResponseEntity<>(new ApiResponse(
            ), HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(new ApiResponse(
                personsRepository.findByEmail(email).orElse(null), HttpStatus.OK
        ), HttpStatus.OK);
    }

    @Transactional
    public ApiResponse updateStatusPerson(Boolean status, Long id){
        Optional<Persons> searchPerson = personsRepository.findById(id);
        if(searchPerson.isPresent()){
            Persons person = searchPerson.get();
            person.setStatus(status);
            personsRepository.save(person);
            return new ApiResponse(personsRepository.findById(id).orElse(null), HttpStatus.OK);
        }
        return new ApiResponse(HttpStatus.BAD_REQUEST, true, "Persona no encontrada");
    }
}
